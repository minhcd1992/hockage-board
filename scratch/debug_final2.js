function convertMath(text) {
    return text.replace(/\$([^$]+)\$/g, (m, p1) => '<Math>{' + JSON.stringify(p1.trim()) + '}</Math>');
}
let question = 'test $\\Delta t_0$ test';
question = question.replace(/\D(elta)/g, (m, p1) => '\\' + 'D' + p1);
let context = convertMath(question);
let finalContent = `<Quiz context={${context}} />`;
console.log(finalContent);
