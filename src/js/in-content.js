import cross from '../images/cross.svg'
import tick from '../images/tick.svg'

const inputTags = ['input', 'textarea']

const bodyEl = document.getElementsByTagName('body')[0]

let ignoredSuggestions = new Map()
let currentSuggestions = []
let lastFocused = null
let lastElem = null
let lastHighlight = null

function resetSuggestions() {
  currentSuggestions = []
}

function isInputElement(el) {
  const tagName = el.tagName.toLowerCase()
  return inputTags.includes(tagName) || (tagName === 'div' && el.getAttribute('contenteditable'))
}

function spellcheckApi(text) {
  return new Promise((resolve) => {
    let url = 'https://api.languagetoolplus.com/v2/check'

    let xhr = new XMLHttpRequest()
    xhr.open('POST', url)

    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
    xhr.setRequestHeader('Accept', 'application/json')

    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        let matches = JSON.parse(xhr.responseText).matches
        let result = []
        for (let i = 0; i < matches.length; i++) {
          let correct_word = matches[i].replacements[0].value
          let start = matches[i].offset
          let length = matches[i].length
          let incorrect_word = text.slice(start, start + length)

          result.push([incorrect_word, correct_word, matches[i].message])
        }
        return resolve(result)
      }
    }

    let data = 'text=' + text + '&language=ru-RU'

    xhr.send(data)
  })
}

const CreateHighlightElem = (inputEl, mistakeText) => {
  try {
    if (inputEl.tagName.toLowerCase() === 'div') {
      const wholeText = getElementText(inputEl)
      const r = document.createRange()
      const startOffset = wholeText.indexOf(mistakeText)
      const endOffset = startOffset + mistakeText.length
      let newInnerHtml = inputEl.innerHTML.replace(/<.*?>/g, '').replace(/&nbsp;/g, ' ')
      if (inputEl.innerHTML !== newInnerHtml) {
        inputEl.innerHTML = newInnerHtml
      }
      r.setStart(inputEl.firstChild, startOffset)
      r.setEnd(inputEl.firstChild, endOffset)
      const rect = r.getClientRects()[0]
      const highlight = document.createElement('div')
      highlight.style.position = 'fixed'
      highlight.style.top = `${rect.top + rect.height - 1}px`
      highlight.style.left = `${rect.left}px`
      highlight.style.width = `${rect.width}px`
      highlight.style.height = '3px'
      highlight.style.zIndex = '1000'
      highlight.style.background = 'rgba(255, 0, 0, 0.5)'
      return highlight
    }
  }
  catch (err) {
    console.error(err)
    return null
  }
}

const CreateButtonElem = (iconSrc, inputEl, oldValue, newValue) => {
  const button = document.createElement('button')
  const img = document.createElement('img')
  img.src = iconSrc
  img.style.height = '1.5rem'
  img.style.width = '1.5rem'
  button.style.margin = '5px'
  button.style.padding = '0'
  button.style.border = '0'
  button.style.background = 'white'
  button.appendChild(img)
  button.onmouseover = () => {
    button.style.cursor = 'pointer'
  }
  button.onmouseleave = () => {
    button.style.cursor = 'default'
  }
  button.onclick = () => {
    if (iconSrc === tick) {
      if (inputEl.tagName.toLowerCase() === 'div') {
        inputEl.innerHTML = inputEl.innerHTML.replace(oldValue, newValue)
      }
      else {
        inputEl.value = inputEl.value.replace(oldValue, newValue)
      }
    }
    else {
      ignoredSuggestions.set(inputEl, {...ignoredSuggestions.get(inputEl), [oldValue + newValue]: true})
    }
    drawNextSuggestion(inputEl)
  }
  return button
}

const calculateElHeight = (el) => {
  el.style.visibility = 'hidden'
  document.getElementsByTagName('body')[0].appendChild(el)
  const height = el.offsetHeight
  el.style.visibility = 'visible'
  document.getElementsByTagName('body')[0].removeChild(el)
  return height
}

const SpellCorrectorElem = (inputEl, oldValue, newValue) => {
  const pos = inputEl.getBoundingClientRect()

  const el = document.createElement('div')

  const text = document.createElement('div')
  el.style.position = 'absolute'
  el.style.left = `${pos.left - 10 + window.scrollX}px`
  // el.style.height = '100px'
  el.style.minWidth = '300px'
  el.style.background = 'white'
  el.style.zIndex = '10000'
  el.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
  el.style.borderRadius = '0.5rem'
  el.style.padding = '0.5rem 1rem'
  el.style.fontSize = '17px'
  el.style.display = 'flex'
  el.style.justifyContent = 'space-between'
  el.style.alignItems = 'center'
  const oldTextSpan = document.createElement('span')
  oldTextSpan.style.color = '#DC2626'
  oldTextSpan.style.fontWeight = 'bold'
  oldTextSpan.appendChild(document.createTextNode(oldValue))
  text.appendChild(oldTextSpan)
  const arrowSpan = document.createElement('span')
  arrowSpan.style.color = '#4B5563'
  arrowSpan.style.fontWeight = 'bold'
  arrowSpan.appendChild(document.createTextNode(' → '))
  text.appendChild(arrowSpan)
  const newTextSpan = document.createElement('span')
  newTextSpan.style.color = '#059669'
  newTextSpan.style.fontWeight = 'bold'
  newTextSpan.appendChild(document.createTextNode(newValue))
  text.appendChild(newTextSpan)
  // diff.forEach((part) => {
  //   // green for additions, red for deletions
  //   // grey for common parts
  //   const color = part.added ? '#059669' : part.removed ? '#DC2626' : '#374151'
  //   const fontWeight = (part.added || part.removed) ? 'bold' : 'normal'
  //   const span = document.createElement('span')
  //   span.style.color = color
  //   span.style.fontWeight = fontWeight
  //   span.appendChild(document.createTextNode(part.value))
  //   text.appendChild(span)
  // }
  // )

  el.appendChild(text)

  const buttons = document.createElement('div')
  buttons.appendChild(CreateButtonElem(tick, inputEl, oldValue, newValue, el))
  buttons.appendChild(CreateButtonElem(cross, inputEl, oldValue, newValue, el))
  el.appendChild(buttons)

  const height = calculateElHeight(el)
  if (pos.top - height > 0) {
    el.style.top = `${pos.top - height + window.scrollY}px`
  }
  else {
    el.style.top = `${pos.top + pos.height + window.scrollY}px`
  }
  return el
}

const drawNextSuggestion = (inputEl) => {
  if (currentSuggestions?.length > 0) {
    const suggestion = currentSuggestions[0]
    currentSuggestions = currentSuggestions.slice(1)
    drawSuggestion(suggestion[0], suggestion[1], suggestion[2], inputEl)
  }
  else {
    if (lastElem) {
      bodyEl.removeChild(lastElem)
      lastElem = null
    }
    if (lastHighlight) {
      bodyEl.removeChild(lastHighlight)
      lastHighlight = null
    }
  }
}

const drawSuggestion = (before, after, reason, inputEl) => {
  const el = SpellCorrectorElem(inputEl, before, after)
  const highlight = CreateHighlightElem(inputEl, before)
  if (lastElem) {
    bodyEl.removeChild(lastElem)
  }
  bodyEl.appendChild(el)
  if (lastHighlight) {
    bodyEl.removeChild(lastHighlight)
  }
  if (highlight) {
    bodyEl.appendChild(highlight)
  }

  lastElem = el
  lastHighlight = highlight
}

const getElementText = (inputEl) => {
  const tagName = inputEl.tagName.toLowerCase()
  let text = ''
  if (tagName === 'div') {
    text = inputEl.innerHTML.replace(/<.*?>/g, '').replace(/&nbsp;/g, ' ')
  }
  else {
    text = inputEl.value
  }
  return text
}

const correct = async () => {
  const inputEl = document.activeElement
  if (lastFocused !== inputEl) {
    resetSuggestions()
  }
  lastFocused = inputEl
  if (isInputElement(inputEl)) {
    let oldValue = getElementText(inputEl)
    const ignoredForEl = ignoredSuggestions.get(inputEl)
    currentSuggestions = await spellcheckApi(oldValue)
    if (ignoredForEl) {
      currentSuggestions = currentSuggestions.filter(val => !(val[0] + val[1] in ignoredForEl))
    }
    drawNextSuggestion(inputEl)
  }
}

const interval = setInterval(correct, 5000)
