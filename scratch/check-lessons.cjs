// Production server: localhost:3100. Chrome remote debugging: localhost:9333.
const assert = require('node:assert/strict');
const fs = require('node:fs');

// The CSS, reusable Math component and MDX renderer must use the same KaTeX.
const katex = require('katex');
const mdxKatex = require(require.resolve('katex', { paths: [require.resolve('rehype-katex')] }));
assert.equal(katex.version, mdxKatex.version, 'KaTeX renderer/CSS version mismatch');

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
    for (const slug of ['bai-1', 'bai-2', 'bai-3', 'bai-4', 'bai-5', 'bai-6']) {
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
        const essayCount = slug === 'bai-6' ? (part === 'theory' ? 2 : 5) : ['bai-3', 'bai-4', 'bai-5'].includes(slug) && part === 'exercises' ? 5 : 0;
        assert.equal(page.questions, expectedQuestions + essayCount, `${url}: all questions rendered`);
        assert.equal(new Set(page.ids).size, page.questions, `${url}: unique question IDs`);
        assert.ok(page.groupsIndependent, `${url}: independent radio groups`);
        assert.deepEqual(page.links, [`/lesson/${slug}`, `/lesson/${slug}/bai-tap`]);
        if (slug === 'bai-1') assert.ok(page.heading.includes('Quãng đường'));
        if (slug === 'bai-2' && part === 'theory') {
          assert.equal(await evaluate(`document.querySelector('caption')?.textContent`), 'So sánh Tốc độ và Vận tốc');
        }
﻿        if (slug === 'bai-6') {
          assert.ok(page.heading.includes('Ba định luật Newton'));
          if (part === 'theory') {
            assert.equal(await evaluate(`document.querySelectorAll('[data-figure]').length`),6);
            await evaluate(`window.setSix = (id,label,value) => {
              const el=document.querySelector('[data-figure="'+id+'"] input[aria-label="'+label+'"]');
              Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,value);
              el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));
            }`);
            const car='document.querySelector(\'[data-simulation="car-forces"]\')';
            assert.equal(await evaluate(`+${car}.dataset.acceleration`),6);
            await evaluate(`setSix('6.2','Khối lượng m (kg)',1300)`);
            await waitFor(`+${car}.dataset.acceleration===12`);
            await evaluate(`setSix('6.2','Lực kéo Fk (N)',2600)`);
            await waitFor(`+${car}.dataset.acceleration===0`);
            assert.equal(await evaluate(`document.querySelectorAll('[data-figure="6.2"] [data-vector="a"]').length`),0);
            await evaluate(`setSix('6.2','Lực kéo Fk (N)',0)`);
            await waitFor(`+${car}.dataset.acceleration===-2`);
            const forceBalance=await evaluate(`(() => {
              const f=document.querySelector('[data-figure="6.2"]');
              const vec=label=>{const a=f.querySelector('[data-vector="'+label+'"] line');return [Number(a.getAttribute('x2'))-Number(a.getAttribute('x1')),Number(a.getAttribute('y2'))-Number(a.getAttribute('y1'))]};
              return {up:vec('N'),down:vec('P'),drag:vec('Fc')};
            })()`);
            assert.equal(forceBalance.up[1]+forceBalance.down[1],0);
            assert.equal(Math.abs(forceBalance.up[1]/forceBalance.drag[0]),5,'All car forces share scale');
            await evaluate(`setSix('6.2','Khối lượng m (kg)',2600);setSix('6.2','Lực kéo Fk (N)',18200)`);
            const air='document.querySelector(\'[data-simulation="air-track"]\')';
            for(const speed of [0.5,1,2]) {
              await evaluate(`setSix('6.4','Vận tốc ban đầu (m/s)',${speed})`);
              await waitFor(`+${air}.dataset.v===${speed}`);
              assert.equal(await evaluate(`+${air}.dataset.time`),0);
              await evaluate(`setSix('6.4','Tiến trình (%)',75)`);
              await waitFor(`+${air}.dataset.x===3`);
              assert.equal(await evaluate(`+${air}.dataset.time`),3/speed);
              assert.equal(await evaluate(`+${air}.querySelector('[data-graph-point]').getAttribute('cx')`),70+50*3/speed,'x–t uses fixed time scale');
              await evaluate(`setSix('6.4','Tiến trình (%)',100)`);
              await waitFor(`+${air}.dataset.x===4`);
              assert.equal(await evaluate(`${air}.dataset.playing`),'false');
            }
            const sensor='document.querySelector(\'[data-simulation="force-sensors"]\')';
            for(const [percent,f] of [[0,0],[10,6],[20,12],[60,12],[70,6],[80,0],[100,0]]) {
              await evaluate(`setSix('6.5','Tiến trình (%)',${percent})`);
              await waitFor(`Math.abs(+${sensor}.dataset.time-${percent/20})<1e-7`);
              assert.equal(await evaluate(`+${sensor}.dataset.forceA`),f);
              assert.equal(await evaluate(`+${sensor}.dataset.forceA + +${sensor}.dataset.forceB`),0);
            }
            // Play/pause, seek, restart and off-screen suspension of both clocks.
            for(const id of ['6.4','6.5']) {
              const f=`document.querySelector('[data-figure="${id}"]')`;
              const sim=`${f}.querySelector('[data-time]')`;
              await evaluate(`${f}.scrollIntoView({block:'center'});${f}.querySelector('[data-action="reset"]').click()`);
              await evaluate(`${f}.querySelector('[data-action="play"]').click()`);
              await waitFor(`+${sim}.dataset.time>0.1`);
              await evaluate(`${f}.querySelector('[data-action="play"]').click()`);
              const paused=await evaluate(`+${sim}.dataset.time`);
              await new Promise(r=>setTimeout(r,120));
              assert.equal(await evaluate(`+${sim}.dataset.time`),paused);
              await evaluate(`${f}.querySelector('[data-action="play"]').click();document.querySelector('h1').scrollIntoView()`);
              await new Promise(r=>setTimeout(r,120));
              const hidden=await evaluate(`+${sim}.dataset.time`);
              await new Promise(r=>setTimeout(r,150));
              assert.equal(await evaluate(`+${sim}.dataset.time`),hidden,'Off-screen simulation stops advancing');
              await evaluate(`${f}.querySelector('[data-action="reset"]').click()`);
            }
            assert.ok(await evaluate(`[...document.querySelectorAll('[data-figure] svg')].every(s=>!/NaN|Infinity/.test(s.outerHTML))`));
            assert.deepEqual(page.ids,[1,2,3,4].map(i=>'bai-6-exercises-'+String(i).padStart(3,'0')));
            await evaluate("document.querySelectorAll('[data-question-id] button').forEach(b=>b.click()); document.querySelectorAll('[data-question-id] details').forEach(d=>d.open=true)");
            await waitFor("document.body.textContent.includes('Đáp án: 800 N') && document.body.textContent.includes('Đáp án: 4/3 m/s²')");
          } else {
            assert.deepEqual(page.ids,Array.from({length:45},(_,i)=>'bai-6-sbt-'+String(i+1).padStart(3,'0')));
            const expected = {"keys":[1,1,1,2,1,1,1,2,1,1,2,1,1,2,1,2,1,0,1,2],"truth":[[true,true,true,false],[true,true,false,false],[true,true,false,true],[true,true,true,false],[true,true,false,false],[true,true,true,false],[true,true,false,true],[true,true,true,true],[true,true,false,true],[false,true,true,true]],"answers":["16049 N","3,0 m/s²","9,0 N","500 m/s²","0,33","5,0 s","2,45 m/s²","500 N","708 N","200 N"]};
            await evaluate('(() => { const keys='+JSON.stringify(expected.keys)+'; const qs=[...document.querySelectorAll("[data-question-id]")]; keys.forEach((key,i)=>qs[i].querySelectorAll("input[type=radio]")[key].click());qs[20].querySelector("input").click();qs[21].querySelector("input").click(); })()');
            assert.ok(await evaluate('[...document.querySelectorAll("[data-question-id]")].slice(0,22).every(q=>q.querySelector("input:checked"))'));
            await evaluate('document.querySelectorAll("[data-question-id] button").forEach(b=>b.click());document.querySelectorAll("details").forEach(d=>d.open=true)');
            await waitFor('document.querySelector("[data-question-id=bai-6-sbt-040]").textContent.includes("Đáp án: 200 N")');
            const answers=await evaluate('(() => {const qs=[...document.querySelectorAll("[data-question-id]")];return {mc:qs.slice(0,20).map(q=>[...q.querySelectorAll("label")].findIndex(l=>l.className.includes("bg-green-100"))),tf:qs.slice(20,30).map(q=>[...q.querySelectorAll("li > strong")].map(x=>x.textContent.includes("ĐÚNG"))),short:qs.slice(30,40).map(q=>q.querySelector(".text-lg.font-bold.text-green-700").textContent),details:document.querySelectorAll("details[open]").length,figures:document.querySelectorAll("[data-exercise-figure]").length}})()');
            assert.deepEqual(answers.mc,expected.keys);
            assert.deepEqual(answers.tf,expected.truth);
            assert.deepEqual(answers.short,expected.answers.map(a=>'Đáp án: '+a));
            assert.equal(answers.details,5);assert.equal(answers.figures,2);
            assert.ok(await evaluate('document.querySelector("[data-question-id=bai-6-sbt-031]").textContent.includes("16049")'));
            assert.ok(await evaluate('document.querySelector("[data-question-id=bai-6-sbt-044]").textContent.includes("dữ kiện bổ sung")'));
            assert.ok(await evaluate('document.querySelector("[data-question-id=bai-6-sbt-045]").textContent.includes("không rời bệ") && document.querySelector("[data-question-id=bai-6-sbt-045]").textContent.includes("680000")'));
          }
          assert.equal(await evaluate(`document.querySelectorAll('.katex-error, p p, p div').length`),0);
          assert.equal(await evaluate(`/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(document.querySelector('article').textContent)`),false);
          await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
          assert.ok(await evaluate(`document.querySelector('article').scrollWidth<=document.querySelector('article').clientWidth+2`),'Lesson 6 fits mobile');
          await call('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
          if (part === 'exercises') {
            await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
            const layout=await evaluate('(() => {const tf=document.querySelector("[data-question-id=bai-6-sbt-021] tbody tr"), data=document.querySelector("[data-question-id=bai-6-sbt-044] table");return {statement:tf.children[1].getBoundingClientRect().width, dataRow:getComputedStyle(data.querySelector("tbody tr")).display, header:getComputedStyle(data.querySelector("thead")).display, width:data.getBoundingClientRect().width, container:data.parentElement.clientWidth}})()');
            assert.ok(layout.statement>230,'True/false statements use phone width');
            assert.equal(layout.dataRow,'table-row','Measurement data stays a table');
            assert.equal(layout.header,'table-header-group');
            assert.ok(layout.width<=layout.container+2,'All five measurements fit phone');
            await call('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
          }
          console.log('PASS lesson 6: Newton models, clocks, force scales, solutions, mobile');
        }

        if (slug === 'bai-5') {
          assert.ok(page.heading.includes('Tổng hợp và phân tích lực'));
          assert.ok(await evaluate(`document.querySelector('article header').textContent.includes('Động lực học')`));
          if (part === 'theory') {
            assert.equal(await evaluate(`document.querySelectorAll('[data-figure]').length`), 6);
            await evaluate(`window.setForceSlider = (figureId, label, value) => {
              const figure = document.querySelector('[data-figure="' + figureId + '"]');
              const input = [...figure.querySelectorAll('input[type="range"]')].find(i => i.getAttribute('aria-label') === label);
              Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value);
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.dispatchEvent(new Event('change', { bubbles: true }));
            }`);
            const output = id => evaluate(`document.querySelector('[data-figure="${id}"] output').textContent`);
            assert.ok((await output('5.2')).includes('F = 50 N'));
            await evaluate(`setForceSlider('5.2', 'Góc α (°)', 0)`);
            await waitFor(`document.querySelector('[data-figure="5.2"] output').textContent.includes('F = 70 N')`);
            await evaluate(`setForceSlider('5.2', 'Góc α (°)', 180)`);
            await waitFor(`document.querySelector('[data-figure="5.2"] output').textContent.includes('F = 10 N')`);
            await evaluate(`setForceSlider('5.2', 'F₁ (N)', 40)`);
            await waitFor(`document.querySelector('[data-figure="5.2"] output').textContent.includes('không có hướng xác định')`);
            assert.equal(await evaluate(`document.querySelectorAll('[data-figure="5.2"] [data-vector="Fth"]').length`), 0);
            await evaluate(`setForceSlider('5.3', 'Góc dốc α (°)', 0)`);
            await waitFor(`document.querySelector('[data-figure="5.3"] output').textContent.includes('P∥ = 0 N')`);
            assert.ok((await output('5.3')).includes('Py = -25.480 N'));
            await evaluate(`setForceSlider('5.3', 'Góc dốc α (°)', 30)`);
            await waitFor(`document.querySelector('[data-figure="5.3"] output').textContent.includes('P∥ = 12.740 N')`);
            assert.ok((await output('5.5')).includes('T = 20 N'));
            await evaluate(`setForceSlider('5.5', 'Góc dây θ (°)', 1)`);
            await waitFor(`document.querySelector('[data-figure="5.5"] output').textContent.includes('T = 572,99 N')`);
            // The hanging cable keeps its length; forces balance at every angle.
            for (const angle of [1,30,60]) {
              await evaluate(`setForceSlider('5.5', 'Góc dây θ (°)', ${angle})`);
              await waitFor(`document.querySelector('[data-cable-angle]').dataset.cableAngle === '${angle}'`);
              const cable = await evaluate(`(() => {
                const f = document.querySelector('[data-figure="5.5"]');
                const p = f.querySelector('[data-cable-angle]').getAttribute('d').match(/-?[0-9]+(?:[.][0-9]+)?/g).map(Number);
                const forces = ['T₁','T₂','P'].map(label => {
                  const a=f.querySelector('[data-vector="'+label+'"] line');
                  return [+a.getAttribute('x2')-+a.getAttribute('x1'), +a.getAttribute('y2')-+a.getAttribute('y1')];
                });
                return { lengths: [Math.hypot(p[2]-p[0],p[3]-p[1]),Math.hypot(p[4]-p[2],p[5]-p[3])],
                  sum: forces.reduce((a,b)=>[a[0]+b[0],a[1]+b[1]],[0,0]) };
              })()`);
              assert.ok(cable.lengths.every(l=>Math.abs(l-130)<1e-7), 'Each half of cable keeps length');
              assert.ok(cable.sum.every(v=>Math.abs(v)<1e-7), 'Cable vector forces sum to zero');
            }
            // Complete the experiment at each preset: gates, position, force and reset.
            const exp = 'document.querySelector(\'[data-figure="5.4"]\')';
            const nextExperiment = () => evaluate(`${exp}.querySelector('[data-action="experiment-next"]').click()`);
            const atStep = n => waitFor(`${exp}.querySelector('[data-experiment-step]').dataset.experimentStep === '${n}'`);
            const blocked = () => evaluate(`${exp}.querySelector('[data-action="experiment-next"]').disabled`);
            for (const [angle, replacement] of [[60,6.1],[90,5],[30,6.8]]) {
              await atStep(1);
              await evaluate(`(() => {
                const select = ${exp}.querySelector('select');
                Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(select, '${angle}');
                select.dispatchEvent(new Event('change', {bubbles:true}));
              })()`);
              await nextExperiment();
              await atStep(2);
              assert.equal(await blocked(), true, 'Cannot record two forces before reaching O');
              await evaluate(`setForceSlider('5.4', 'Mức kéo hai lực (%)', 50)`);
              await waitFor(`${exp}.querySelector('[data-reading]').dataset.reading === '1.5'`);
              assert.equal(await blocked(), true);
              await evaluate(`${exp}.querySelector('[data-action="pull-to-target"]').click()`);
              await waitFor(`${exp}.querySelector('[data-aligned]').dataset.aligned === 'true'`);
              assert.equal(await blocked(), false);
              const elastic = await evaluate(`${exp}.querySelector('[data-elastic]').getAttribute('d')`);
              await nextExperiment();
              await atStep(3);
              assert.equal(await evaluate(`${exp}.querySelectorAll('[data-apparatus]').length`), 1);
              assert.equal(await blocked(), true, 'Replacement starts away from O');
              await evaluate(`setForceSlider('5.4', 'Lực thay thế (N)', ${replacement})`);
              assert.equal(await blocked(), true, 'Correct magnitude alone is insufficient');
              await evaluate(`setForceSlider('5.4', 'Hướng kéo β (°)', 0)`);
              await waitFor(`${exp}.querySelector('[data-aligned]').dataset.aligned === 'true'`);
              const distance = await evaluate(`(() => {
                const r=${exp}.querySelector('[data-ring]'), o=${exp}.querySelector('[data-target]');
                return Math.hypot(+r.getAttribute('cx')-+o.getAttribute('cx'),+r.getAttribute('cy')-+o.getAttribute('cy'));
              })()`);
              assert.ok(distance <= 0.9, 'Replacement restores ring position within reading resolution');
              if (angle === 90) assert.equal(await evaluate(`${exp}.querySelector('[data-elastic]').getAttribute('d')`), elastic);
              await nextExperiment();
              await atStep(4);
              assert.ok(await evaluate(`${exp}.querySelector('[data-experiment-result]').textContent.includes('${String(replacement).replace('.',',')} N')`));
              assert.equal(await evaluate(`${exp}.querySelectorAll('.katex-error').length`), 0);
              const sum = await evaluate(`(() => {
                const f=${exp}, vectors=['F₁','F₂','Flt'].map(label=> {
                  const a=f.querySelector('[data-vector="'+label+'"] line');
                  return [+a.getAttribute('x2')-+a.getAttribute('x1'),+a.getAttribute('y2')-+a.getAttribute('y1')];
                });
                return [vectors[0][0]+vectors[1][0]-vectors[2][0],vectors[0][1]+vectors[1][1]-vectors[2][1]];
              })()`);
              assert.ok(sum.every(v=>Math.abs(v)<1e-7), 'Parallelogram diagonal equals sum of measured force vectors');
              await call('Emulation.setDeviceMetricsOverride', {width:390,height:844,deviceScaleFactor:1,mobile:true});
              assert.ok(await evaluate(`${exp}.scrollWidth <= ${exp}.clientWidth + 2`), 'Experiment result fits phone');
              await call('Emulation.setDeviceMetricsOverride', {width:1280,height:900,deviceScaleFactor:1,mobile:false});
              await evaluate(`${exp}.querySelector('[data-action="experiment-back"]').click()`);
              await atStep(3);
              await evaluate(`setForceSlider('5.4', 'Lực thay thế (N)', 2)`);
              await waitFor(`${exp}.querySelector('[data-action="experiment-next"]').disabled`);
              for (let i=0;i<2;i++) await evaluate(`${exp}.querySelector('[data-action="experiment-back"]').click()`);
              await atStep(1);
              await nextExperiment();
              await atStep(2);
              assert.equal(await blocked(), true, 'Returning to setup clears the previous pull');
              await evaluate(`${exp}.querySelector('[data-action="experiment-back"]').click()`);
            }
            assert.ok(await evaluate(`[...document.querySelectorAll('[data-figure]')].every(f => f.getBoundingClientRect().width <= 601 && f.querySelector('svg').getBoundingClientRect().height <= 224)`), 'Figures have compact desktop bounds');

            // Check the SVG never emits invalid coordinates, including the zero resultant.
            assert.ok(await evaluate(`[...document.querySelectorAll('svg')].every(s => !/NaN|Infinity/.test(s.outerHTML))`));
            assert.deepEqual(page.ids, [1,2,3].map(n => 'bai-5-exercises-' + String(n).padStart(3,'0')));
            await evaluate(`document.querySelectorAll('[data-question-id="bai-5-exercises-001"] input[type=radio]')[3].click()`);
            await evaluate(`document.querySelector('[data-question-id="bai-5-exercises-001"] button').click()`);
            await waitFor(`document.querySelector('[data-question-id="bai-5-exercises-001"]').textContent.includes('Chính xác!')`);
            for (const id of ['002', '003']) {
              await evaluate(`document.querySelector('[data-question-id="bai-5-exercises-${id}"] button').click()`);
            }
            await waitFor(`document.body.textContent.includes('Đáp án: 14,14 N') && document.body.textContent.includes('Đáp án: 86,6 N; 50,0 N')`);
          } else {
            assert.deepEqual(page.ids, Array.from({length:45}, (_,i) => 'bai-5-sbt-' + String(i+1).padStart(3,'0')));
            const correct = [1,3,1,0,1,1,0,1,1,0,1,1,0,1,1,1,3,1,1,0];
            const expectedTF = [[true,false,false,true],[true,true,true,true],[true,true,true,true],[true,true,true,false],[true,true,true,false],[true,true,true,false],[true,false,true,true],[true,false,true,true],[true,true,true,false],[true,false,true,true]];
            const expectedShort = ['61','4765','30','34,6','90','342','50','5,0','11276','9,8'];
            await evaluate(`(() => {
              const correct = ${JSON.stringify(correct)};
              const questions = [...document.querySelectorAll('[data-question-id]')];
              for(let i=0; i<20; i++) questions[i].querySelectorAll('input[type=radio]')[correct[i]].click();
              questions[20].querySelector('input[type=radio]').click();
              questions[21].querySelector('input[type=radio]').click();
            })()`);
            assert.ok(await evaluate(`[...document.querySelectorAll('[data-question-id]')].slice(0,22).every(q => q.querySelector('input[type=radio]:checked'))`), 'Selections remain independent');
            await evaluate(`(() => {
              const questions = [...document.querySelectorAll('[data-question-id]')];
              for(let i=0; i<40; i++) questions[i].querySelector('button').click();
              for(const detail of document.querySelectorAll('details')) detail.open = true;
            })()`);
            await waitFor(`document.querySelector('[data-question-id="bai-5-sbt-040"]').textContent.includes('Đáp án: 9,8')`);
            const answers = await evaluate(`(() => {
              const questions = [...document.querySelectorAll('[data-question-id]')];
              return {
                mc: questions.slice(0,20).map(q => [...q.querySelectorAll('label')].findIndex(l => l.className.includes('bg-green-100'))),
                tf: questions.slice(20,30).map(q => [...q.querySelectorAll('li > strong')].map(s => s.textContent.includes('ĐÚNG'))),
                short: questions.slice(30,40).map(q => q.querySelector('.text-lg.font-bold.text-green-700')?.textContent),
                essays: document.querySelectorAll('details[open]').length,
                diagrams: document.querySelectorAll('[data-exercise-figure]').length,
                controls: /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(document.querySelector('article').textContent),
                invalidNesting: document.querySelectorAll('p p, p div, h3 p').length,
              };
            })()`);
            assert.deepEqual(answers.mc, correct);
            assert.deepEqual(answers.tf, expectedTF);
            assert.deepEqual(answers.short, expectedShort.map(a => 'Đáp án: ' + a));
            assert.equal(answers.essays, 5);
            assert.equal(answers.diagrams, 2);
            assert.equal(answers.controls, false);
            assert.equal(answers.invalidNesting, 0);
            assert.ok(await evaluate(`document.querySelector('[data-question-id="bai-5-sbt-041"]').textContent.includes('hợp lực ngang bằng 0')`));
            assert.ok(await evaluate(`document.querySelector('[data-question-id="bai-5-sbt-044"]').textContent.includes('phạm vi sai số')`));
          }
          assert.equal(await evaluate(`document.querySelectorAll('.katex-error').length`), 0);
          await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
          assert.ok(await evaluate(`(() => { const a = document.querySelector('article'); return a.scrollWidth <= a.clientWidth + 2; })()`), 'Lesson 5 fits mobile width');
          if (part === 'theory') await evaluate(`document.querySelector('[data-figure="5.2"]').scrollIntoView()`);
          else await evaluate(`document.querySelector('[data-question-id="bai-5-sbt-021"]').scrollIntoView()`);
          const capture = await call('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync('.next/lesson5-' + part + '-mobile.png', Buffer.from(capture.data, 'base64'));
          await call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
        }
        if (slug === 'bai-4') {
          assert.equal(await evaluate(`document.querySelectorAll('.katex-error').length`), 0, 'Lesson 4 formulas render');
          assert.ok(page.heading.includes('Rơi tự do và chuyển động ném'));
          if (part === 'theory') {
            assert.deepEqual(page.ids, [1,2,3,4].map(n => `bai-4-check-${String(n).padStart(3, '0')}`), 'Lecture keeps its original four checks');
            assert.equal(await evaluate(`document.querySelectorAll('[data-figure]').length`), 7);
            await evaluate(`window.setLesson4Slider = (figureId, label, value) => {
              const figure = [...document.querySelectorAll('[data-figure]')].find(f => f.dataset.figure === figureId);
              const input = [...figure.querySelectorAll('input[type="range"]')].find(i => i.getAttribute('aria-label').startsWith(label));
              Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value);
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.dispatchEvent(new Event('change', { bubbles: true }));
            }`);
            await evaluate(`setLesson4Slider('4.3','Tiến trình',100)`);
            await waitFor(`document.querySelector('[data-figure="4.3"] output').textContent.includes('chạm đất đồng thời')`);
            assert.ok(await evaluate(`document.querySelector('[data-figure="4.3"] output').textContent.includes('chạm đất = 2 s')`));
            await evaluate(`setLesson4Slider('4.3','Tốc độ',20)`);
            await waitFor(`document.querySelector('[data-figure="4.3"] output').textContent.includes('Tầm xa = 40 m')`);
            assert.ok(await evaluate(`document.querySelector('[data-figure="4.3"] output').textContent.includes('chạm đất = 2 s')`));
            await evaluate(`setLesson4Slider('4.3','Độ cao',80)`);
            await waitFor(`document.querySelector('[data-figure="4.3"] output').textContent.includes('chạm đất = 4 s')`);
            assert.ok(await evaluate(`document.querySelector('[data-figure="4.3"] output').textContent.includes('Tầm xa = 80 m')`));
            for (const angle of [30,60]) {
              await evaluate(`setLesson4Slider('4.4','Góc ném',${angle})`);
              await waitFor(`document.querySelector('[data-figure="4.4"] output').textContent.includes('L = 34,64 m')`);
            }
            await evaluate(`setLesson4Slider('4.4','Góc ném',45)`);
            await waitFor(`document.querySelector('[data-figure="4.4"] output').textContent.includes('L = 40 m')`);
            // Frame changes must transform positions AND velocities at the same instant.
            await evaluate(`window.setLesson4Frame = (id, value) => {
              const select = document.querySelector('[data-figure="' + id + '"] select[aria-label="Hệ quy chiếu"]');
              select.value = value;
              select.dispatchEvent(new Event('change', { bubbles: true }));
            }`);
            const sim = async id => evaluate(`(() => {
              const s = document.querySelector('[data-figure="${id}"] [data-simulation]');
              return {time:+s.dataset.time, vx:+s.dataset.vx, vy:+s.dataset.vy, x:+s.dataset.x, y:+s.dataset.y, playing:s.dataset.playing, frame:s.dataset.frame};
            })()`);
            const near = (actual, expected, name) => assert.ok(Math.abs(actual - expected) < 1e-7, `${name}: ${actual} != ${expected}`);
            await evaluate(`setLesson4Slider('4.3','Độ cao',20)`);
            await evaluate(`setLesson4Slider('4.3','Tốc độ',10)`);
            await evaluate(`setLesson4Slider('4.3','Tiến trình',50)`);
            let state = await sim('4.3');
            near(state.time, 1, 'Horizontal time'); near(state.x, 10, 'Horizontal x'); near(state.y, 5, 'Horizontal y');
            near(state.vx, 10, 'Horizontal vx'); near(state.vy, 10, 'Horizontal vy');
            await evaluate(`setLesson4Frame('4.3','moving')`);
            state = await sim('4.3');
            near(state.time, 1, 'Frame switch keeps time'); near(state.vx, 0, 'Moving frame vx'); near(state.x, 0, 'Moving frame x'); near(state.vy, 10, 'Moving frame vy');
            assert.ok(await evaluate(`(() => {
              const p = document.querySelector('[data-figure="4.3"] [data-trajectory="predicted"]').getAttribute('d').match(/-?\\d+(?:\\.\\d+)?/g).map(Number);
              return p.filter((_,i) => i%2 === 0).every(x => Math.abs(x-p[0]) < 1e-7);
            })()`), 'Moving frame trajectory is vertical');
            await evaluate(`setLesson4Frame('4.3','custom')`);
            for (const u of [20,-20]) {
              await evaluate(`setLesson4Slider('4.3','Vận tốc hệ',${u})`);
              state = await sim('4.3');
              near(state.vx, 10-u, 'Custom frame vx'); near(state.x, 10-u, 'Custom frame x'); near(state.time, 1, 'Custom frame keeps time');
            }
            await evaluate(`setLesson4Frame('4.3','ground')`);
            await evaluate(`setLesson4Slider('4.4','Tiến trình',50)`);
            state = await sim('4.4'); near(state.vy, 0, 'Apex vertical velocity'); near(state.vx, Math.sqrt(200), 'Apex horizontal velocity');
            await evaluate(`setLesson4Frame('4.4','moving')`);
            state = await sim('4.4'); near(state.vx, 0, 'Moving apex vx'); near(state.vy, 0, 'Moving apex vy');
            await evaluate(`setLesson4Frame('4.4','ground')`);
            for (const progress of [25,75]) {
              await evaluate(`setLesson4Slider('4.4','Tiến trình',${progress})`);
              state = await sim('4.4');
              assert.equal(state.vy > 0, progress < 50, 'Vertical velocity reverses after apex');
              assert.equal(await evaluate(`(() => {
                const arrow=document.querySelector('[data-figure="4.4"] [data-vector="v′ᵧ"] line');
                return +arrow.getAttribute('y2') < +arrow.getAttribute('y1');
              })()`), progress < 50, 'Vertical arrow follows velocity sign');
            }
            await evaluate(`setLesson4Slider('4.7','Tiến trình',100)`);
            state = await sim('4.7');
            near(state.time,10,'Aid impact time'); near(state.x,500,'Aid range'); near(state.y,490,'Aid fall'); near(state.vx,50,'Aid vx'); near(state.vy,98,'Aid vy');
            await evaluate(`setLesson4Frame('4.7','moving')`);
            state = await sim('4.7'); near(state.vx,0,'Aircraft frame vx'); near(state.x,0,'Aircraft frame x'); near(state.vy,98,'Aircraft frame vy');
            near(await evaluate(`+document.querySelector('[data-figure="4.7"] [data-plane-x]').dataset.planeX`),0,'Aircraft stationary in own frame');
            await evaluate(`setLesson4Frame('4.6','falling')`);
            for (const progress of [25,75,100]) {
              await evaluate(`setLesson4Slider('4.6','Tiến trình',${progress})`);
              state = await sim('4.6');
              near(state.vy,400/Math.sqrt(1300),'Free-fall frame constant vy');
              near(await evaluate(`+document.querySelector('[data-figure="4.6"] [data-target-y]').dataset.targetY`),20,'Target stationary in falling frame');
            }
            near(state.x,30,'Meeting x'); near(state.y,20,'Meeting y in falling frame');
            await evaluate(`setLesson4Frame('4.6','ground')`);
            await evaluate(`setLesson4Slider('4.6','Tốc độ',5)`);
            await evaluate(`setLesson4Slider('4.6','Tiến trình',100)`);
            state = await sim('4.6'); near(state.y,0,'Slow projectile stops at ground');
            assert.ok(await evaluate(`document.querySelector('[data-figure="4.6"] output').textContent.includes('Tốc độ chưa đủ')`));
            await evaluate(`setLesson4Slider('4.6','Tốc độ',20)`);
            await evaluate(`setLesson4Slider('4.1','Tiến trình',50)`);
            assert.deepEqual(await evaluate(`[...document.querySelectorAll('[data-figure="4.1"] [data-drop]')].map(e=>e.dataset.landed)`), ['false','true'], 'Air resistance changes landing times');
            await evaluate(`document.querySelector('[data-figure="4.1"] input[type=checkbox]').click()`);
            await evaluate(`setLesson4Slider('4.1','Tiến trình',100)`);
            assert.deepEqual(await evaluate(`[...document.querySelectorAll('[data-figure="4.1"] [data-drop]')].map(e=>e.dataset.landed)`), ['true','true'], 'Vacuum restores simultaneous fall');
            // Exercise real animation, pause, reset, automatic stop and replay for all seven.
            for (const id of ['4.1','4.2','4.3','4.4','4.5','4.6','4.7']) {
              await evaluate(`(() => {
                const f=document.querySelector('[data-figure="${id}"]');
                f.querySelector('[data-action="reset"]').click(); f.scrollIntoView();
              })()`);
              await evaluate(`document.querySelector('[data-figure="${id}"] [data-action="play"]').click()`);
              await waitFor(`+document.querySelector('[data-figure="${id}"] [data-simulation]').dataset.time > 0.1`);
              await evaluate(`document.querySelector('[data-figure="${id}"] [data-action="play"]').click()`);
              const paused = (await sim(id)).time;
              await new Promise(resolve => setTimeout(resolve,150));
              near((await sim(id)).time,paused,'Pause freezes '+id);
              await evaluate(`setLesson4Slider('${id}','Tiến trình',99.9)`);
              await evaluate(`document.querySelector('[data-figure="${id}"] [data-action="play"]').click()`);
              await waitFor(`document.querySelector('[data-figure="${id}"] [data-simulation]').dataset.playing === 'false'`);
              await evaluate(`document.querySelector('[data-figure="${id}"] [data-action="play"]').click()`);
              await waitFor(`document.querySelector('[data-figure="${id}"] [data-simulation]').dataset.playing === 'true'`);
              await evaluate(`document.querySelector('[data-figure="${id}"] [data-action="reset"]').click()`);
              near((await sim(id)).time,0,'Reset '+id);
            }
            await evaluate(`setLesson4Frame('4.7','ground'); setLesson4Slider('4.7','Tiến trình',65)`);
            await evaluate(`document.querySelector('[data-figure="4.7"] svg').scrollIntoView()`);
            const aidScreenshot = await call('Page.captureScreenshot', { format:'png' });
            fs.writeFileSync('.next/lesson4-aid-simulation.png', Buffer.from(aidScreenshot.data,'base64'));
            console.log('PASS all lesson 4 simulation clocks, vectors, reference frames and collision boundaries');
          }
          await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
          if (part === 'theory') {
            await evaluate(`document.querySelector('[data-figure="4.7"] svg').scrollIntoView()`);
          }
          const overflow = await evaluate(`(() => {const a=document.querySelector('article');return {width:a.clientWidth,scroll:a.scrollWidth};})()`);
          assert.ok(overflow.scroll <= overflow.width + 2, 'Lesson 4 mobile: ' + JSON.stringify(overflow));
          const screenshot = await call('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync('.next/lesson4-' + part + '-mobile.png', Buffer.from(screenshot.data, 'base64'));
          await call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
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
        if (part === 'exercises' && ['bai-1', 'bai-2', 'bai-3', 'bai-4'].includes(slug)) {
          // Selecting an answer in one question must not clear another question.
          assert.ok(await evaluate(`(() => {
            const [first, second] = document.querySelectorAll('[data-question-id]');
            first.querySelector('input[type=radio]').click();
            second.querySelector('input[type=radio]').click();
            return first.querySelector('input[type=radio]').checked && second.querySelector('input[type=radio]').checked;
          })()`));
          await evaluate(`document.querySelector('[data-question-id] button').click()`);
          await waitFor(`document.querySelector('[data-question-id]').textContent.includes('Giải thích:')`);
          if (['bai-3', 'bai-4'].includes(slug)) {
            const correct = slug === 'bai-3'
              ? [2,1,0,1,2,2,2,2,1,2,0,1,1,0,1,0,1,2,1,1]
              : [0,0,2,0,1,1,2,2,2,2,1,2,0,0,0,1,1,2,1,0];
            const expectedTF = slug === 'bai-3'
              ? [[true,true,true,true],[true,false,true,true],[false,true,false,true],[true,true,true,false],[true,true,true,true],[true,false,true,true],[true,true,false,true],[true,true,true,true],[true,false,true,true],[true,true,true,true]]
              : [[true,true,true,false],[false,true,true,false],[true,false,true,true],[true,true,false,true],[false,true,true,true],[false,true,true,false],[true,true,false,true],[false,true,true,false],[true,false,false,true],[true,true,true,true]];
            const expectedShort = slug === 'bai-3'
              ? ['1','20','1','8','2','108','3','6,2','0,4','77,5']
              : ['3','45','35','30','20','22,4','40','48','2','4,0'];
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
            await waitFor(`document.querySelector('[data-question-id="${slug}-exercises-040"]').textContent.includes('Đáp án: ${expectedShort[9]}')`);
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
            assert.deepEqual(answers.tf, expectedTF, 'All 40 true/false statements');
            assert.deepEqual(answers.short, expectedShort.map(a => 'Đáp án: ' + a));
            assert.equal(answers.mathErrors, 0, 'All revealed answers have valid math');
            assert.equal(answers.essays, 5);
            assert.equal(answers.invalidNesting, 0);
            await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
            const overflow = await evaluate(`(() => {
              const article = document.querySelector('article');
              return {width:article.clientWidth,scroll:article.scrollWidth};
            })()`);
            assert.ok(overflow.scroll <= overflow.width + 2, 'Expanded exercises fit mobile: ' + JSON.stringify(overflow));
            if (slug === 'bai-4') {
              assert.equal(page.questions, 45, 'Lesson 4 contains exactly 45 exercises');
              assert.ok(await evaluate(`[...document.querySelectorAll('[data-question-id]')].every((q,i) => q.textContent.includes('Câu ' + (i + 1)))`), 'All question labels retain Vietnamese text');
              assert.ok(await evaluate(`document.querySelector('[data-question-id="bai-4-exercises-043"]').textContent.includes('không phải vận tốc thực tế')`));
              await evaluate(`document.querySelector('[data-question-id="bai-4-exercises-022"]').scrollIntoView()`);
              const mobile = await call('Page.captureScreenshot', { format: 'png' });
              fs.writeFileSync('.next/lesson4-exercises-expanded-mobile.png', Buffer.from(mobile.data, 'base64'));
            }
            await call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
          }
        }
        // Scripts must be smaller than their parent glyphs for both MDX and <Math>.
        const scriptSizes = await evaluate(`(() => {
          return [...document.querySelectorAll('.katex .msupsub .sizing.reset-size6.size3')].map(e => ({
            size: parseFloat(getComputedStyle(e).fontSize),
            parent: parseFloat(getComputedStyle(e.parentElement).fontSize),
          }));
        })()`);
        assert.ok(scriptSizes.length > 0, url + ': subscript/superscript coverage');
        assert.ok(scriptSizes.every(s => Math.abs(s.size / s.parent - 0.7) < 0.002), url + ': KaTeX scripts use 70% font size');

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
    assert.equal(library.gradeCount, 6);
    assert.ok(await evaluate(`document.body.textContent.includes('Bài 5: Tổng hợp và phân tích lực')`));
    assert.ok(library.correctTitle && !library.oldTitle);
    assert.ok(await evaluate(`document.body.textContent.includes('Bài 6: Ba định luật Newton')`));
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
