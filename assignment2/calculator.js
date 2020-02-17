let answer = "0";
let equation = "";
let empty_equation = "";
let empty_answer = "0";
let evaluated = false;

$(function () {
    $('#answer').val(empty_answer);

    function updateEquation() {
        $('#equation').val(equation);
    }

    $('#all-clear').click(() => {
        allClear();
    });

    $('#clear-entry').click(() => {
        backSpace();
    });

    function backSpace() {
        if(answer=="ERROR" || answer=="Infinity"){
            allClear();
        }
        if (equation.length > 0) {
            equation = equation.slice(0, -1);
            updateEquation();
        }
    }

    function allClear() {
        equation = empty_equation;
        evaluated = false;
        updateEquation();
        $('#answer').val(empty_answer);
    }

    function operandLast() {
        if (equation == "") {
            return false;
        }
        let lastChar = equation.slice(-1);
        if ("+-/*".includes(lastChar)) {
            return true;
        }
        else {
            return false;
        }
    }

    function openBracketLast() {
        if (equation == "") {
            return false;
        }
        let lastChar = equation.slice(-1);
        if (lastChar == "(") {
            return true;
        }
        else {
            return false;
        }
    }

    function useAnswer() {
        if(answer=="ERROR"){
            answer = empty_answer;
        }
        equation = answer;
        answer = empty_answer;
        updateEquation();
        evaluated = false;
    }

    $('#open-bracket').click(() => {
        if (answer != empty_answer) {
            useAnswer();
        }
        equation += "(";
        updateEquation();
    });
    $('#close-bracket').click(() => {
        if (!openBracketLast() && !operandLast()) {
            equation += ")";
            updateEquation();
        }
    });
    $('#1').click((e) => {
        equation += "1";
        updateEquation();
    });
    $('#2').click(() => {
        equation += "2";
        updateEquation();
    });
    $('#3').click(() => {
        equation += "3";
        updateEquation();
    });
    $('#4').click(() => {
        equation += "4";
        updateEquation();
    });
    $('#5').click(() => {
        equation += "5";
        updateEquation();
    });
    $('#6').click(() => {
        equation += "6";
        updateEquation();
    });
    $('#7').click(() => {
        equation += "7";
        updateEquation();
    });
    $('#8').click(() => {
        equation += "8";
        updateEquation();
    });
    $('#9').click(() => {
        equation += "9";
        updateEquation();
    });
    $('#0').click(() => {
        equation += "0";
        updateEquation();
    });

    $('#divide').click(() => {
        if (answer != empty_answer) {
            useAnswer();
        }
        if(openBracketLast()){
            return;
        }
        if (!operandLast()) {
            equation += "/";
            updateEquation();
        }
        else {
            backSpace();
            equation += "&#247;";
            updateEquation();
        }
    });
    $('#multiply').click(() => {
        if (answer != empty_answer) {
            useAnswer();
        }
        if(openBracketLast()){
            return;
        }
        if (!operandLast()) {
            equation += "*";
            updateEquation();
        }
        else {
            backSpace();
            equation += "x";
            updateEquation();
        }
    });
    $('#subtract').click(() => {
        if (answer != empty_answer) {
            useAnswer();
        }
        if(openBracketLast()){
            return;
        }
        if (!operandLast()) {
            equation += "-";
            updateEquation();
        }
        else {
            backSpace();
            equation += "-";
            updateEquation();
        }
    });
    $('#add').click(() => {
        if (answer != empty_answer) {
            useAnswer();
        }
        if(openBracketLast()){
            return;
        }
        if (!operandLast()) {
            equation += "+";
            updateEquation();
        }
        else {
            backSpace();
            equation += "+";
            updateEquation();
        }
    });

    $('#decimal').click(() => {
        if (!equation.includes(".")) {
            equation += ".";
            updateEquation();
        }
    });

    $('#evaluate').click(() => {
        try {
            answer = eval(equation).toString();
            $('#answer').val(answer);
            equation = ""
            evaluated = true;
        } catch (e) {
            answer = "ERROR"
            $('#answer').val(answer);
        }
    });
});
