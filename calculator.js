const OPERATION = Object.freeze({
    ADD: Symbol("+"),
    SUBTRACT: Symbol("-"),
    MULTIPLY: Symbol("*"),
    DIVIDE: Symbol("/"),
    MODULO : Symbol("%"),
    isOperator: (value) => Object.values(OPERATION).find(operation => operation.description === value) != undefined
})


const CALCULATION_ACTION_CLASS = "calcAction"
const EQUALS_BTN_ID = "equalButton"
const RESET_BTN_ID = "resetButton"
const INVERT_BTN_ID="invertButton"
const NUMBER_DISPLAY_ID = "calculatorDisplay"
const operationQueue = []
let resultIsDisplaying = false

window.onload = _ => {
    const calculatorButtons = Array.from(document.getElementsByClassName(CALCULATION_ACTION_CLASS))
    calculatorButtons.forEach(button => button.addEventListener("click",_ => addToQueue(button.dataset.value)))
    document.getElementById(EQUALS_BTN_ID)?.addEventListener("click", () => {
        calculateNext(true)
        updateDisplay()
    })
    document.getElementById(RESET_BTN_ID)?.addEventListener("click",() => resetCalculator())
    document.getElementById(INVERT_BTN_ID)?.addEventListener("click",() => invertCurrentNumber())
    window.addEventListener("keyup",ev => keypressToAction(ev.key))
};

function keypressToAction(key) {
    const keyIsNumber = !isNaN(key)
    const keyIsOperator = OPERATION.isOperator(key)
    if (keyIsNumber || keyIsOperator) {
        addToQueue(key)
    } else if (key == "Backspace") {
        removeLastDigit()
    }
}

function removeLastDigit() {
    const firstItem = operationQueue.length >0 ? operationQueue[0] : null
    const firstitemIsNumber = !isNaN(firstItem)

    if (firstitemIsNumber) {
        const strNum = String(firstItem)
        const numLength = strNum.length
        let result
        if (numLength == 1) {
            result = 0
        } else {
            result = strNum.substring(0, strNum.length-1)
        }

        operationQueue[0] = result
        updateDisplay()
    }

}

function invertCurrentNumber() {
    const firstitemIsANumber = operationQueue.length > 0 ? !isNaN(operationQueue[0]) : null
    if (firstitemIsANumber) {
        const invertedNumber  = operationQueue[0] * -1
        operationQueue[0] = invertedNumber
    }
    updateDisplay()
}


function resetCalculator() {
    operationQueue.splice(0, operationQueue.length) //clear queue
    updateDisplay()
}



function addToQueue(value) {
    const queueIsEmpty = operationQueue.length === 0;
    const lastIndex = operationQueue.length - 1;
    const valueIsNumber = !isNaN(value)
    const valueIsOperator = OPERATION.isOperator(value)
    const lastItem = lastIndex > -1 ? operationQueue[lastIndex] : null
    const lastIndexIsOperator = OPERATION.isOperator(lastItem)
    const valueIsDot = value === "."

    if (valueIsDot &&  lastItem != null ) {
        const lastItemisNumber = !isNaN(lastItem)
        const doesNotHaveDot = !String(lastItem).includes(".")
        if (lastItemisNumber && doesNotHaveDot) {
            operationQueue[lastIndex] = String(lastItem) + "."
        }
    }
    else if (valueIsNumber) {
        if (queueIsEmpty || lastIndexIsOperator || resultIsDisplaying) {
            resultIsDisplaying = false;
            operationQueue.push(value)
        } else if (!isNaN(lastItem)  ) { //the user may be enterring a number with multiple digits.  In that case we merge the 2 digits into 1. for example "2" + "8" = 28
            const digit1 = lastItem
            const digit2 = value
            operationQueue[lastIndex] = Number(String(digit1) + String(digit2))
        }
        
    }
    else if (valueIsOperator) {
    
        if (lastIndexIsOperator) {
          //if the user is spamming operators back to back use the last operator presed for the next calculations
          operationQueue[lastIndex] = value
        } else {
            operationQueue.push(value)
            
        }
    } else {
        throw new Error(`value ${value} being added to queue is nethier a number or operator`)
    }
    calculateNext()
    updateDisplay()
    
}


function calculateNext(_isEqualButtonPress = false) {
    try {
        if (_isEqualButtonPress && operationQueue.length < 3) return;  //if equals button was pressed and there's enough items in queue to calculate a result
        if (!_isEqualButtonPress && operationQueue.length < 4) return;  // we should only evaluate the previous 3 items in queue if an operator is pressed.  (the 4th element is 'guarnteeded' to be an operator hence the length check)
        const firstNum = Number(operationQueue[0])
        const operator = operationQueue[1]
        const secondNum = Number(operationQueue[2])
    
        const result = operate(firstNum, operator, secondNum)
        const roundedResult = Math.round(result * 10) / 10  //rounds to nearest 2 decimal places
    
        operationQueue.splice(0, 3) //remove calculated result parameters from array
        operationQueue.unshift(roundedResult) //set up result to be calculated again with the next number
        resultIsDisplaying = true;
    } catch(error) {
        resetCalculator()
        updateDisplay(error.message)
        throw error
    }
}


/**
 * 
  * operator(operator : OPERATION, num1 : number, num2: number) : number
 *      create a variable of type number named result with the initial value of 0
 *      switch(operator)
 *          add :  result = num1 + num2
 *          subtract:  result = num1 - num2
 *          multiply : result = num1 * num2
 *          divide : result = num1 / num2
 *          default : Error "operator does not exist"
 *      
 *      return result
 * end
 */
function operate(num1, operator, num2) {
    const operatorIsNotOperator = !OPERATION.isOperator(operate)
    let result = 0;

    switch(operator) {
        case OPERATION.ADD.description : 
            result = num1 + num2
            break;
        case OPERATION.SUBTRACT.description :
            result = num1 - num2
            break;
        case OPERATION.MULTIPLY.description :
            result = num1 * num2;
            break;
        case OPERATION.DIVIDE.description :
            if (num2 == 0) throw new Error("Can't divide by 0")
            result = num1/num2 
            break;
        case OPERATION.MODULO.description :
            result = num1 % num2
            break;
        default : 
            throw new Error(`${operator} is not an operator`)
    }

    return result
}


//** if result is showing do not append  */

function updateDisplay(_customText) {
    const display = document.getElementById(NUMBER_DISPLAY_ID)
    const lastIndex =  operationQueue.length  -1
    const lastItem = lastIndex >= 0 ? operationQueue[lastIndex] : null

    if (_customText)
        display.innerText = _customText
    else if (lastItem === null) 
        display.innerText = "0"
     else if (OPERATION.isOperator(lastItem)) {
        display.innerText = operationQueue[lastIndex - 1] 
     } else {
        display.innerText = lastItem
     }
          // The first item in queue is the cur calculated value 
    
}

/**
 * 
 * Create enum named OPERATION 
 *  add = "+"
 *  subtract = "-"
 *  multiply = "x"
 *  divide = "÷"
 *  EMPTY = "empty",
 * 
 * create const variable of type generic array named queue with the initial value of [0]
 * 
 * For each element of class "calcAction" 
 *      const value = element.dataset.valuee
 *      add a onClick listener to the element that calls addToQueue(value)
 * end for each
 * 
 * add onClick listener to equalsButton that 
 *      calls calculateNext()
 * 
 * add onClick listener to clearButton that 
 *      set queue to an empty array
 *      updateDisplay()
 * 
 * updateDisplay() {
 *      if a first item in the queue exist then 
 *          set display text to first item
 *      else //list is empty
 *          set display to 0
 * }
 * 
* addToQueue(item : unkown) 
    if the parameter "item" is a OPERATION then
        if queue is not empty and the last item in the queue is an operation then
            overwrite the last item in queue with this item.
        else // if the last item in the queue is a number
            push this item to the back of the queue
            calculateNext()
        endif
    else if the parameter "item" is a number then
        if the queue is empty then
            push number to back of queue (first item)
        else if the queue's last item is a operator then
            push number to back of queue 
        else if the queue's last item is a number then
            make both numbers strings
            append 
            
    endif
end

 * operator(operator : OPERATION, num1 : number, num2: number) : number
 *      create a variable of type number named result with the initial value of 0
 *      switch(operator)
 *          add :  result = num1 + num2
 *          subtract:  result = num1 - num2
 *          multiply : result = num1 * num2
 *          divide : result = num1 / num2
 *          default : Error "operator does not exist"
 *      
 *      return result
 * end
 * 
 * calculateNext() {
 *      if the length of queue is NOT equal to or greater than 3 then return; // we are not ready to do a calculation
 *      create a variable of type number named result with the initial value of 0
 *      const firstNum = Number(queue[0])
 *      const operator = queue[1]
 *      const secondNum = Number(queue[2])
 *      result = operate(operator, firstNum, secondNum)
 *      remove the first 3 numbers from the queue
 *      set the first element in the queue to result
 *      updateDisplay()
 * 
 */