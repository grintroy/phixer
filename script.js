let inputFiles = []

let phixer
let player
let playerSketch
const inputChanged = new Event("inputChanged")
let playerWavElement

const durationMatrix = [
  5, 15, 30, 45, 60
]

class PlayerButton {

  constructor(element) {
    phixer.takes.forEach(take => {
      take.player.onstop = () => {
        this.stop()
      }
    })

    this.updateConnection()
    this.buttonElement = element
    this.playButton = element.querySelector("[phixer-player-button='play']")
    this.stopButton = element.querySelector("[phixer-player-button='stop']")
  }

  updateConnection() {
    this.player = phixer.player
    this.player.connect(phixer.player.connectedTake)
  }

  start() {
    this.playButton.hidden = true
    this.buttonElement.style.backgroundColor = "black"
    this.stopButton.hidden = false
    this.now = Tone.now()
    Tone.Transport.start(this.now, phixer.preferences.inPoint).stop(this.now + phixer.preferences.duration)
    this.now = undefined
  }

  stop() {
    this.playButton.hidden = false
    this.buttonElement.style.backgroundColor = "rgb(var(--bs-primary-rgb))"
    this.stopButton.hidden = true
    Tone.Transport.stop()
  }
}

const playerButtonElement = document.getElementById("player-button")

let playerButton

playerButtonElement.onclick = () => {

  if (!playerButton) {
    try {
      playerButton = new PlayerButton(playerButtonElement)
    } catch (e) {
      // console.warn("No file(s) uploaded.")
      console.error(e)
      return
    }
  }

  const state = Tone.Transport.state

  if (state === "stopped") {
    playerButton.start()
  } else if (state === "started") {
    playerButton.stop()
  }
}

const rangesTextMatrix = {
  "range-2-2": {
    0: "widest",
    20: "wide",
    40: "optimal",
    60: "narrow",
    80: "narrowest"
  },
  "range-2-3": {
    0: "lowest",
    20: "low",
    40: "optimal",
    60: "high",
    80: "highest"
  }
}

const allRanges = document.querySelectorAll(".range-wrap")
const allRNSwitches = document.querySelectorAll(".switch-range-number")
const allBtnNext = document.querySelectorAll(".button-next")

const uploadFilesDiv = document.querySelector("#upload-files-div")
const uploadFilesInput = uploadFilesDiv.querySelector("#upload-files-input")
const uploadFilesLink = uploadFilesDiv.querySelector("a")

const buttonStep1 = document.querySelector("#btn-step1")

const spinner = document.querySelector("#spinner")
const spinnerContainer = document.querySelector("#spinner-container")
const footer = document.querySelector("#footer")
const noFilesWindow = document.querySelector("#no-files")

hideElements()

allRNSwitches.forEach(block => {
  const range = block.querySelector(".switch-range")
  const number = block.querySelector(".switch-number")

  range.querySelector(".text-muted").addEventListener("click", () => {
    range.hidden = true
    number.hidden = false
  })

  number.querySelector(".text-muted").addEventListener("click", () => {
    number.hidden = true
    range.hidden = false
  })
})

allBtnNext.forEach(button => {
  const id = Number(button.id.slice(-1))
  const currentStep = document.querySelector(`#step-${id}`)
  const nextStep = document.querySelector(`#step-${id + 1}`)

  button.addEventListener("click", () => {
    currentStep.style.opacity = 0
    footer.style.opacity = 0
    spinner.hidden = false
    spinnerContainer.style.opacity = 1

    currentStep.ontransitionend = (e) => {
      if (e.propertyName === "opacity") {

        currentStep.hidden = true
        footer.hidden = true

        initButtonNextStep(id)

        if (id !== 1 || !inputFiles.length) {
          initNextStep(nextStep, id + 1)
        } else {
          phixer.loaded.addEventListener("loaded", () => {
            initNextStep(nextStep, id + 1)
          }, { once: true })
        }
      }
    }
  })
})

function initButtonNextStep(nStepId) {
  eval('initButtonStep' + nStepId + '()')
}

function initNextStep(nextStep, nStepId) {

  if (!inputFiles.length) {
    nextStep = noFilesWindow
  }

  nextStep.hidden = false

  setTimeout(() => {
    spinnerContainer.style.opacity = 0
    nextStep.style.opacity = 1
    footer.style.opacity = 1

    if (!inputFiles.length) {
      console.warn("No files uploaded. Please upload files.")
    } else {
      eval('initStep' + nStepId + '()')
    }

    nextStep.ontransitionend = (e) => {
      if (e.propertyName === "opacity") {
        spinner.hidden = true
      }
    }
  }, 50)
}

function initButtonStep1() {
  playerWavElement = document.querySelector("#player")
  phixer = new Phixer(inputFiles)
}

function initStep2() {

  allRanges.forEach(wrap => {

    const range = wrap.querySelector(".form-range")
    const bubble = wrap.querySelector(".bubble")
    setBubble(range, bubble)

    range.addEventListener("input", () => {
      range.addEventListener("input", () => {
        setBubble(range, bubble)
      })
      setBubble(range, bubble)
    })
    setBubble(range, bubble)

  })

  { // Takes dropdown initialization

    try {
      console.log(`Current connection (default): ${phixer.takes[0].name}.`)

      const takesDropdown = document.querySelector("#takes-dropdown")

      if (phixer.takes) takesDropdown.innerHTML = ""

      phixer.takes.forEach((take) => {
        takesDropdown.innerHTML += `<li><a class="dropdown-item" href="#/">${take.name}</a></li>`
      })

      takesDropdown.querySelectorAll("li a")[0].classList.add("active")

      takesDropdown.querySelectorAll("li a").forEach((option, i) => {

        option.addEventListener("click", () => {

          Tone.Transport.stop()
          phixer.player.connect(phixer.takes[i])
          playerWavElement.dispatchEvent(inputChanged)
          console.log(`Current connection: ${phixer.takes[i].name}.`)

          try {
            playerButton.updateConnection()
          } catch { }

          takesDropdown.querySelectorAll("li a").forEach((item) => {
            item.classList.remove("active")
          })

          takesDropdown.querySelectorAll("li a")[i].classList.add("active")

        })
      })
    } catch { }

  }

  { // p5 waveform

    playerSketch = (p) => {
      p.setup = () => {

        p.noCanvas()
        drawWaveform()

        // Schedule re-render when the window is resized

        window.addEventListener("resize", () => {
          drawWaveform()
        })

        playerWavElement.addEventListener("inputChanged", () => {
          drawWaveform()
        })

      }

      function drawWaveform() {

        p.remove()

        const elWidth = playerWavElement.clientWidth
        const elHeight = playerWavElement.clientHeight


        p.createCanvas(elWidth, elHeight)

        const bandWidth = 6 // in pixels
        const roundCorners = 4 // in px
        p.stroke(204, 204, 204)
        p.strokeWeight(bandWidth / 2)
        const data = phixer.player.connectedTake.arrayBuffer

        const sampleRate = phixer.player.connectedTake.sampleRate


        const inpoint = phixer.preferences.inPoint // in sec
        const inpointSamples = inpoint * sampleRate
        const outpoint = phixer.preferences.outPoint // in sec
        const outpointSamples = outpoint * sampleRate
        const durationSamples = outpointSamples - inpointSamples

        const yMargin = 6 // in px, distance from the loudest point to the border of the canvas
        const yMarginCoef = (elHeight - yMargin * 2) / elHeight

        const newData = data.slice(inpointSamples, outpointSamples)

        const pixelToSampleRatio = (durationSamples) / elWidth

        let emptySpacePointX
        let emptySpaceLinesArray = []
        const emptySpaceHeight = elHeight - yMargin * 2

        for (let i = 0; i < durationSamples; i += bandWidth * pixelToSampleRatio) {

          const pixelX = i / pixelToSampleRatio

          if (i < newData.length) {
            const lineHeight = Math.abs(newData[Math.floor(i)]) * yMarginCoef * elHeight
            const margin = (elHeight - lineHeight) / 2
            p.line(pixelX, margin, pixelX, margin + lineHeight)
          } else if (!emptySpacePointX) {
            emptySpacePointX = pixelX
            break
          }
        }

        for (let i = - emptySpaceHeight + emptySpacePointX; i < elWidth; i += bandWidth * 2) {
          emptySpaceLinesArray.push({
            x1: i,
            y1: yMargin + emptySpaceHeight,
            x2: i + emptySpaceHeight,
            y2: yMargin
          })
        }

        if (emptySpacePointX < elWidth) {
          emptySpaceLinesArray.forEach((line) => {
            if (line.x1 < emptySpacePointX) {
              const diff = emptySpacePointX - line.x1
              line.x1 = emptySpacePointX
              line.y1 -= diff
            }
            p.line(line.x1, line.y1, line.x2, line.y2)
          })

          p.fill(0, 0)
          p.rect(emptySpacePointX, yMargin, elWidth - emptySpacePointX + bandWidth / 2, elHeight - yMargin * 2)
        }
      }
    }

    const p5js = new p5(playerSketch, playerWavElement)

  }

  { // Listeners for player's in-out points and duration

    const inOutPointElements = document.querySelectorAll(".in-out-points")
    const inPointElement = document.querySelector("#in-point")
    const durationItems = document.querySelectorAll(".player-duration-item")
    let activeDurationItem
    updateActiveDurationItem(0)

    function updateActiveDurationItem(i) {
      activeDurationItem = Array.from(durationItems).find((element) => Array.from(element.classList).includes("active"))
      document.querySelector("#take-duration p").innerHTML = durationMatrix[i] + " seconds"
    }

    function updateValues(element) {

      // https://stackoverflow.com/questions/6649327/regex-to-remove-letters-symbols-except-numbers

      let value = element.value

      value = formatString(value)

      if (value.length > 4) {
        value = value.slice(0, 4)
      }

      value = "0".repeat(4 - value.length) + value.slice(0, value.length - 2) + value.slice(value.length - 2, value.length)

      const valueDisplay = value.slice(0, 2) + ":" + value.slice(2, 4)

      element.value = valueDisplay

      let min = Math.floor(value / 100)
      let sec = value - min * 100

      const timeInSec = min * 60 + sec

      const attribute = element.getAttribute("phixer-in-out-points")
      const duration = phixer.preferences.duration

      let target
      let newValue

      if (attribute === "in") {
        phixer.preferences.inPoint = timeInSec
        min = Math.floor((timeInSec + duration) / 60)
        sec = timeInSec + duration - min * 60
        target = document.querySelector("#out-point")
      } else if (attribute === "out") {
        phixer.preferences.outPoint = timeInSec
        min = Math.floor((timeInSec - duration) / 60)
        sec = timeInSec - duration - min * 60
        target = document.querySelector("#in-point")
      }

      newValue = min * 100 + sec

      if (formatString(target.value) != newValue) {
        target.value = newValue
        target.dispatchEvent(new Event("input"))
        phixer.player.updatePoints()
        playerWavElement.dispatchEvent(inputChanged)
      }

    }

    function formatString(inputString) { // Delete any characters but numbers and remove leading zeros

      inputString = inputString.replace(/\D/g, '')

      while (inputString.charAt(0) == 0 && inputString) {
        inputString = inputString.slice(1, inputString.length)
      }

      return inputString
    }

    inOutPointElements.forEach((element) => {
      element.addEventListener("input", () => updateValues(element))
    })

    durationItems.forEach((item, i) => {
      item.addEventListener("click", () => {
        phixer.preferences.duration = durationMatrix[i]
        activeDurationItem.classList.remove("active")
        durationItems[i].classList.add("active")
        updateActiveDurationItem(i)
        updateValues(inPointElement)
      })
    })
  }
}

// https://stackoverflow.com/questions/35659430/how-do-i-programmatically-trigger-an-input-event-without-jquery
// https://stackoverflow.com/questions/11406605/how-to-make-a-link-act-as-a-file-input

uploadFilesLink.addEventListener("click", (e) => {
  e.preventDefault()
  uploadFilesInput.dispatchEvent(new Event("click"))
})

uploadFilesInput.addEventListener("change", (e) => {
  for (const file of e.target.files) {
    inputFiles.push(file)
    console.log('File(s) uploaded: ' + file.name)
  }
  document.querySelector("#uploadedFilesCount").innerHTML = inputFiles.length
})

// https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop

function dropHandler(event) {
  console.log('File(s) dropped')

  // Prevent default behavior (Prevent file from being opened)
  event.preventDefault()

  if (event.dataTransfer.items) {
    // Use DataTransferItemList interface to access the file(s)
    for (let i = 0; i < event.dataTransfer.items.length; i++) {
      // If dropped items aren't files, reject them
      if (event.dataTransfer.items[i].kind === 'file') {
        const tmpFile = event.dataTransfer.items[i].getAsFile()
        inputFiles.push(tmpFile)
        console.log('... file[' + i + '].name = ' + tmpFile.name)
      }
    }
  } else {
    // Use DataTransfer interface to access the file(s)
    for (let i = 0; i < event.dataTransfer.files.length; i++) {
      console.log('... file[' + i + '].name = ' + event.dataTransfer.files[i].name)
    }
  }

  document.querySelector("#upload-window").style.borderWidth = null
  document.querySelector("#uploadedFilesCount").innerHTML = inputFiles.length
}

function dragOverHandler(event) {

  document.querySelector("#upload-window").setAttribute("style", "border-width: 0.5rem !important")

  // Prevent default behavior (Prevent file from being opened)
  event.preventDefault()
}

function dragLeaveHandler(event) {

  document.querySelector("#upload-window").style.borderWidth = null

  // Prevent default behavior (Prevent file from being opened)
  event.preventDefault()
}

function setBubble(range, bubble) {

  const halfWidth = bubble.getBoundingClientRect().width / 2 // in px

  let val = range.value

  for (const levels of Object.keys(rangesTextMatrix[range.name])) {
    if (Number(val) >= Number(levels)) {
      bubble.innerHTML = rangesTextMatrix[range.name][levels]
    }
  }

  const min = range.min
  const max = range.max


  bubble.style.left = `calc(${val}% - ${(val / 50 - 1) * 3}rem - ${(val / 50 - 1) * 1}rem - ${halfWidth}px)`
}

function hideElements() {
  noFilesWindow.hidden = true
  document.querySelector("#step-2").hidden = true
  document.querySelector("#block-2-2-2").hidden = true
  document.querySelector("#block-2-3-2").hidden = true
  document.querySelector("#stop-button").hidden = true
  spinner.hidden = true
  spinnerContainer.style.opacity = 1
}
