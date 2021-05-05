import * as Diff from 'diff'
import cross from '../images/cross.svg'
import tick from '../images/tick.svg'

const inputTags = ['input', 'textarea']

const bodyEl = document.getElementsByTagName('body')[0]

let lastElem = null

const getCorrections = (str) => {
  return str.substr(1) + '$'
}

const CreateButtonElem = (iconSrc, inputEl, oldValue, newValue, spellCorrectorEl) => {
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
      inputEl.value = inputEl.value.replace(oldValue, newValue)
    }
    bodyEl.removeChild(spellCorrectorEl)
    lastElem = null
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

  const diff = Diff.diffChars(oldValue, newValue)

  const el = document.createElement('div')

  const text = document.createElement('div')
  el.style.position = 'absolute'
  el.style.left = `${pos.left - 10}px`
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
  diff.forEach((part) => {
    // green for additions, red for deletions
    // grey for common parts
    const color = part.added ? '#059669' : part.removed ? '#DC2626' : '#374151'
    const fontWeight = (part.added || part.removed) ? 'bold' : 'normal'
    const span = document.createElement('span')
    span.style.color = color
    span.style.fontWeight = fontWeight
    span.appendChild(document.createTextNode(part.value))
    text.appendChild(span)
  }
  )

  el.appendChild(text)

  const buttons = document.createElement('div')
  buttons.appendChild(CreateButtonElem(tick, inputEl, oldValue, newValue, el))
  buttons.appendChild(CreateButtonElem(cross, inputEl, oldValue, newValue, el))
  el.appendChild(buttons)

  const height = calculateElHeight(el)
  if (pos.top - height > 0) {
    el.style.top = `${pos.top - height}px`
  }
  else {
    el.style.top = `${pos.top + pos.height}px`
  }
  return el
}

const correct = () => {
  const inputEl = document.activeElement
  const tagName = inputEl.tagName.toLowerCase()
  if (tagName === 'div' && inputEl.getAttribute('contenteditable')) {
    // currentFocused.innerHTML = 'loh pidr'
  }

  if (inputTags.includes(tagName)) {
    const oldValue = inputEl.value
    const newValue = getCorrections(oldValue)
    if (oldValue !== newValue) {
      const el = SpellCorrectorElem(inputEl, oldValue, newValue)
      if (lastElem) {
        bodyEl.removeChild(lastElem)
      }
      bodyEl.appendChild(el)
      lastElem = el
    }
  }
}

const interval = setInterval(correct, 5000)
