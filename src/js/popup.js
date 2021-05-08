document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("popup-input").addEventListener("input", spellcheckApi, false);

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
}, false);
