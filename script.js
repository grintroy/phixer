{
  // Test. Populate two arrays with sine wave values.

  const audio1 = []
  const audio2 = []
  const phaseDifference =  30 * (Math.PI / 180) // in radians
  const sampleRate = 44100  // samples per second

  for (let t = 0; t < 1; t += 1/sampleRate) {
      audio1.push(sinDisplacement(1, 1.6, t, 0))
      audio2.push(sinDisplacement(1, 1.1, t, phaseDifference))
  }

  // Phixer.takes.push(new Phixer.Take(audio1, "test"))

  // console.log("Input:", Phixer.takes[0].buffer)
  // console.log("Output:", Phixer.resample(Phixer.takes[0]))

  function sinDisplacement(A, freq, t, phi) {
    return A * Math.sin(2 * Math.PI * freq * t + phi)
  }
}

let inputFiles = []

let phixer
let player
hideElements()

function setup() {

}

function draw() {

}

function keyPressed() {
  switch (keyCode) {
    case LEFT_ARROW:
      phixer.takes[0].player.start()
      break;
    case RIGHT_ARROW:
      console.log(inputFiles);
      break;
  }
}

class PlayerButton {

  constructor(element) {
    this.player = phixer.player
    this.buttonElement = element
    this.playButton = element.querySelector("[phixer-player-button='play']")
    this.stopButton = element.querySelector("[phixer-player-button='stop']")

    this.initConnection()
  }

  initConnection() {
    this.player.connectedTonePlayer.onstop = () => {
      playerButton.stop()
    }
  }

  updateConnection() {
    this.player.connectedTonePlayer.onstop = null
    this.player = phixer.player

    this.initConnection()
  }

  start() {
    this.playButton.hidden = true
    this.buttonElement.style.backgroundColor = "black"
    this.stopButton.hidden = false

    this.player.connectedTonePlayer.start()
  }

  stop() {
    this.playButton.hidden = false
    this.buttonElement.style.backgroundColor = "rgb(var(--bs-primary-rgb))"
    this.stopButton.hidden = true
  }
}

const playerButtonElement = document.getElementById("player-button")

let playerButton

playerButtonElement.onclick = () => {

  if (!playerButton) playerButton = new PlayerButton(playerButtonElement)

  const state = phixer.player.connectedTonePlayer.state

  if (state === "stopped") {
    playerButton.start()

  } else if (state === "started") {
    playerButton.player.connectedTonePlayer.stop()
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
    setTimeout(() => {
      currentStep.hidden = true
      nextStep.hidden = false
      setTimeout(() => {
        nextStep.style.opacity = 1
      }, 1);
    }, 350)
  })
})

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
})

// https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop

function dropHandler(event) {
  console.log('File(s) dropped');

  // Prevent default behavior (Prevent file from being opened)
  event.preventDefault();

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
      console.log('... file[' + i + '].name = ' + event.dataTransfer.files[i].name);
    }
  }

  document.querySelector("#upload-window").style.borderWidth = null

  const filesCounter = document.querySelector("#uploadedFilesCount").innerHTML = inputFiles.length
}

function dragOverHandler(event) {

  document.querySelector("#upload-window").setAttribute("style", "border-width: 0.5rem !important")

  // Prevent default behavior (Prevent file from being opened)
  event.preventDefault();
}

function dragLeaveHandler(event) {

  document.querySelector("#upload-window").style.borderWidth = null

  // Prevent default behavior (Prevent file from being opened)
  event.preventDefault();
}

buttonStep1.addEventListener("click", () => {

  phixer = new Phixer(inputFiles)

  setTimeout(() => {

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

    {
      console.log(`Current connection (default): ${phixer.takes[0].name}.`)

      // Takes dropdown menu initialization

      const takesDropdown = document.querySelector("#takes-dropdown")

      if (phixer.takes) takesDropdown.innerHTML = ""

      phixer.takes.forEach((take) => {
        takesDropdown.innerHTML += `<li><a class="dropdown-item" href="#">${take.name}</a></li>`
      })

      takesDropdown.querySelectorAll("li a")[0].classList.add("active")

      takesDropdown.querySelectorAll("li a").forEach((option, i) => {

        option.addEventListener("click", () => {

          phixer.player.connectedTonePlayer.stop()

          phixer.player.connect(phixer.takes[i])

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

    }

  }, 350)
})

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
  document.querySelector("#step-2").hidden = true
  document.querySelector("#block-2-2-2").hidden = true
  document.querySelector("#block-2-3-2").hidden = true
  document.querySelector("#stop-button").hidden = true
}
