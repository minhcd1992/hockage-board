function convertMath(text) {
    return text.replace(/\$([^$]+)\$/g, (m, p1) => '<Math>{' + JSON.stringify(p1.trim()) + '}</Math>');
}
let question = 'test $\\Delta t_0$ test';
let context = convertMath(question);
let finalContent = `<Quiz context={${context}} />`;
console.log(finalContent);
