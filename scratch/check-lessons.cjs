// Production server: localhost:3100. Chrome remote debugging: localhost:9333.
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const target = await (await fetch('http://127.0.0.1:9333/json/new?about:blank', { method: 'PUT' })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
  let requestId = 0;
  const requests = new Map();
  const errors = [];
  ws.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      errors.push(message.params.args.map(arg => arg.value || arg.description).join(' '));
    }
    const pending = requests.get(message.id);
    if (pending) {
      requests.delete(message.id);
      message.error ? pending.reject(message.error) : pending.resolve(message.result);
    }
  });
  const call = (method, params = {}) => new Promise((resolve, reject) => {
    requests.set(++requestId, { resolve, reject });
    ws.send(JSON.stringify({ id: requestId, method, params }));
  });
  const evaluate = async expression => {
    const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const waitFor = async expression => {
    for (let attempt = 0; attempt < 120; attempt++) {
      if (await evaluate(expression)) return;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`Timed out: ${expression}`);
  };
  try {
    await call('Runtime.enable');
    await call('Page.enable');
    await call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    for (const slug of ['bai-1', 'bai-2', 'bai-3']) {
      for (const part of ['theory', 'exercises']) {
        const url = `/lesson/${slug}${part === 'exercises' ? '/bai-tap' : ''}`;
        const questionPart = part;
        const expectedQuestions = (fs.readFileSync(`content/lessons/${slug}/${questionPart}.mdx`, 'utf8').match(/<(Quiz|QuizTF|QuizShort)\s/g) || []).length;
        const response = await fetch(`http://localhost:3100${url}`);
        assert.equal(response.status, 200, url);
        await call('Page.navigate', { url: `http://localhost:3100${url}` });
        await waitFor(`location.pathname === ${JSON.stringify(url)} && document.documentElement?.hasAttribute('data-board-ready')`);
        const page = await evaluate(`(() => {
          const questions = [...document.querySelectorAll('[data-question-id]')];
          const groups = new Map();
          for (const question of questions) {
            for (const radio of question.querySelectorAll('input[type=radio]')) {
              if (!groups.has(radio.name)) groups.set(radio.name, new Set());
              groups.get(radio.name).add(question.dataset.questionId);
            }
          }
          return {
            title: document.title,
            heading: document.querySelector('h1')?.textContent,
            grade: document.querySelector('article header')?.textContent.includes('Lớp 10'),
            questions: questions.length,
            ids: questions.map(q => q.dataset.questionId),
            groupsIndependent: [...groups.values()].every(owners => owners.size === 1),
            links: [...document.querySelectorAll('nav[aria-label="Nội dung bài học"] a')].map(a => a.getAttribute('href')),
            styled: getComputedStyle(document.querySelector('h1')).fontSize === '48px',
          };
        })()`);
        assert.ok(page.grade && page.title.includes('lớp 10'), `${url}: grade metadata`);
        assert.ok(page.styled, `${url}: Tailwind styles`);
        const essayCount = slug === 'bai-3' && part === 'exercises' ? 5 : 0;
        assert.equal(page.questions, expectedQuestions + essayCount, `${url}: all questions rendered`);
        assert.equal(new Set(page.ids).size, page.questions, `${url}: unique question IDs`);
        assert.ok(page.groupsIndependent, `${url}: independent radio groups`);
        assert.deepEqual(page.links, [`/lesson/${slug}`, `/lesson/${slug}/bai-tap`]);
        if (slug === 'bai-1') assert.ok(page.heading.includes('Quãng đường'));
        if (slug === 'bai-2' && part === 'theory') {
          assert.equal(await evaluate(`document.querySelector('caption')?.textContent`), 'So sánh Tốc độ và Vận tốc');
        }
        if (slug === 'bai-3') {
          assert.equal(await evaluate(`document.querySelectorAll('.katex-error').length`), 0, 'Lesson 3 math renders');
          if (part === 'theory') {
            assert.equal(await evaluate(`document.querySelectorAll('[data-figure]').length`), 7);
            assert.equal(await evaluate(`document.querySelectorAll('article section').length`), 5);
            await evaluate(`window.setGraphSlider = (prefix, label, value) => {
              const figure = [...document.querySelectorAll('[data-figure]')].find(f => f.dataset.figure.startsWith(prefix));
              const input = [...figure.querySelectorAll('input')].find(i => i.getAttribute('aria-label').startsWith(label));
              Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value);
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.dispatchEvent(new Event('change', { bubbles: true }));
            }`);
            await evaluate(`setGraphSlider('B4.', 'Vận tốc', 10)`);
            await evaluate(`setGraphSlider('B4.', 'Gia tốc', -2)`);
            await evaluate(`setGraphSlider('B4.', 'Thời điểm', 2)`);
            await waitFor(`document.querySelector('[data-figure^="B4."] output').textContent.includes('v = 6 m/s')`);
            assert.ok(await evaluate(`document.querySelector('[data-figure^="B4."] output').textContent.includes('Chậm dần')`));
            await evaluate(`setGraphSlider('B4.', 'Thời điểm', 8)`);
            await waitFor(`document.querySelector('[data-figure^="B4."] output').textContent.includes('v = -6 m/s')`);
            assert.ok(await evaluate(`document.querySelector('[data-figure^="B4."] output').textContent.includes('Nhanh dần')`));
            assert.ok(await evaluate(`document.querySelector('[data-figure^="D2."] output').textContent.includes('25 m')`));
            await evaluate(`setGraphSlider('D2.', 'Thời gian', 10)`);
            await waitFor(`document.querySelector('[data-figure^="D2."] output').textContent.includes('gặp lại tại vị trí 100 m')`);
            const desktop = await call('Page.captureScreenshot', { format: 'png' });
            fs.writeFileSync('.next/lesson3-desktop.png', Buffer.from(desktop.data, 'base64'));
            await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
            const overflow = await evaluate(`(() => {
              const article = document.querySelector('article');
              return { width: article.clientWidth, scroll: article.scrollWidth,
                offenders: [...article.querySelectorAll('*')].filter(e => !e.closest('.katex-mathml') && e.getBoundingClientRect().right > 391).slice(0, 12).map(e => ({tag:e.tagName, class:e.className, text:e.textContent.slice(0,80)})) };
            })()`);
            assert.ok(overflow.scroll <= overflow.width + 2, 'Lesson 3 fits mobile width: ' + JSON.stringify(overflow));
            const mobile = await call('Page.captureScreenshot', { format: 'png' });
            fs.writeFileSync('.next/lesson3-mobile.png', Buffer.from(mobile.data, 'base64'));
            await call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
          }
        }
        if (part === 'exercises') {
          // Selecting an answer in one question must not clear another question.
          assert.ok(await evaluate(`(() => {
            const [first, second] = document.querySelectorAll('[data-question-id]');
            first.querySelector('input[type=radio]').click();
            second.querySelector('input[type=radio]').click();
            return first.querySelector('input[type=radio]').checked && second.querySelector('input[type=radio]').checked;
          })()`));
          await evaluate(`document.querySelector('[data-question-id] button').click()`);
          await waitFor(`document.querySelector('[data-question-id]').textContent.includes('Giải thích:')`);
          if (slug === 'bai-3') {
            const correct = [2,1,0,1,2,2,2,2,1,2,0,1,1,0,1,0,1,2,1,1];
            await evaluate(`(() => {
              const correct = ${JSON.stringify(correct)};
              const questions = [...document.querySelectorAll('[data-question-id]')];
              for (let i = 1; i < 20; i++) questions[i].querySelectorAll('input[type=radio]')[correct[i]].click();
            })()`);
            await evaluate(`(() => {
              const questions = [...document.querySelectorAll('[data-question-id]')];
              for (let i = 1; i < 40; i++) questions[i].querySelector('button').click();
              for (const detail of document.querySelectorAll('details')) detail.open = true;
            })()`);
            await waitFor(`document.querySelector('[data-question-id="bai-3-exercises-040"]').textContent.includes('Đáp án: 77,5')`);
            const answers = await evaluate(`(() => {
              const questions = [...document.querySelectorAll('[data-question-id]')];
              return {
                mc: questions.slice(0,20).map(q => [...q.querySelectorAll('label')].findIndex(l => l.className.includes('bg-green-100'))),
                tf: questions.slice(20,30).map(q => [...q.querySelectorAll('li > strong')].map(s => s.textContent.includes('ĐÚNG'))),
                short: questions.slice(30,40).map(q => q.querySelector('.text-lg.font-bold.text-green-700')?.textContent),
                mathErrors: document.querySelectorAll('.katex-error').length,
                essays: document.querySelectorAll('details[open]').length,
                invalidNesting: document.querySelectorAll('p p, p div, h3 p').length,
              };
            })()`);
            assert.deepEqual(answers.mc, correct, 'All 20 correct option indices');
            assert.deepEqual(answers.tf, [[true,true,true,true],[true,false,true,true],[false,true,false,true],[true,true,true,false],[true,true,true,true],[true,false,true,true],[true,true,false,true],[true,true,true,true],[true,false,true,true],[true,true,true,true]], 'All 40 true/false statements');
            assert.deepEqual(answers.short, ['1','20','1','8','2','108','3','6,2','0,4','77,5'].map(a => 'Đáp án: ' + a));
            assert.equal(answers.mathErrors, 0, 'All revealed answers have valid math');
            assert.equal(answers.essays, 5);
            assert.equal(answers.invalidNesting, 0);
            await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
            const overflow = await evaluate(`(() => {
              const article = document.querySelector('article');
              return {width:article.clientWidth,scroll:article.scrollWidth};
            })()`);
            assert.ok(overflow.scroll <= overflow.width + 2, 'Expanded exercises fit mobile: ' + JSON.stringify(overflow));
            await call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
          }
        }
        console.log(`PASS ${url}: ${page.questions} questions, grade, styles, navigation`);
      }
    }
    for (const url of ['/lesson/unknown', '/lesson/unknown/bai-tap']) {
      assert.equal((await fetch(`http://localhost:3100${url}`)).status, 404, url);
    }
    await call('Page.navigate', { url: 'http://localhost:3100/' });
    await waitFor(`location.pathname === '/' && !!document.querySelector('canvas[data-ink-engine]') && !!document.querySelector('[title="Mở bài học"]')`);
    await evaluate(`document.querySelector('[title="Mở bài học"]').click()`);
    await waitFor(`document.body.textContent.includes('Thư viện Bài giảng')`);
    const library = await evaluate(`({
      gradeCount: document.body.textContent.split('Lớp 10').length - 1,
      correctTitle: document.body.textContent.includes('Bài 1: Quãng đường & Độ dịch chuyển'),
      oldTitle: document.body.textContent.includes('Khái quát về Vật lí'),
    })`);
    assert.equal(library.gradeCount, 3);
    assert.ok(library.correctTitle && !library.oldTitle);
    await evaluate(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Lý thuyết').click()`);
    await waitFor(`!!document.querySelector('iframe')?.contentDocument?.documentElement?.hasAttribute('data-board-ready')`);
    assert.ok(await evaluate(`document.querySelector('iframe').contentDocument.querySelector('header').textContent.includes('Lớp 10')`));
    await evaluate(`document.querySelector('[title="Làm bài tập"]').click()`);
    await waitFor(`[...document.querySelectorAll('iframe')].some(f => f.contentWindow.location.pathname === '/lesson/bai-1/bai-tap' && f.contentDocument?.documentElement?.hasAttribute('data-board-ready'))`);
    console.log('PASS board library, lesson iframe, exercise toggle, unknown routes');
    assert.deepEqual(errors, [], 'No browser runtime/console errors');
  } finally {
    ws.close();
    await fetch(`http://127.0.0.1:9333/json/close/${target.id}`);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
