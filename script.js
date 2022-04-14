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

let playing = false

const playButton = document.getElementById("play-button-img")
const stopButton = document.getElementById("stop-button")
const playerButtonWrapper = document.getElementById("player-button")

document.getElementById("player-button").onclick = () => {
  if (!playing) {
    playButton.style.display = "none"
    playerButtonWrapper.style.backgroundColor = "black"
    stopButton.style.display = "block"
    playing = true
  } else {
    playButton.style.display = "block"
    playerButtonWrapper.style.backgroundColor = "rgb(var(--bs-primary-rgb))"
    stopButton.style.display = "none"
    playing = false
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

const allRNSwitches = document.querySelectorAll(".switch-range-number")

allRNSwitches.forEach(block => {
  const range = block.querySelector(".switch-range")
  const number = block.querySelector(".switch-number")

  range.querySelector(".text-muted").addEventListener("click", () => {
    range.style.display = "none"
    number.style.display = "block"
  })

  number.querySelector(".text-muted").addEventListener("click", () => {
    number.style.display = "none"
    range.style.display = "block"
  })
})

const allBtnNext = document.querySelectorAll(".button-next")

allBtnNext.forEach(button => {
  const id = Number(button.id.slice(-1))
  
  button.addEventListener("click", () => {
    document.querySelector(`#step-${id}`).style.display = "none"
    document.querySelector(`#step-${id + 1}`).style.display = "block"
  })
})

const uploadFilesDiv = document.querySelector("#upload-files-div")
const uploadFilesInput = uploadFilesDiv.querySelector("#upload-files")
const uploadFilesLink = uploadFilesDiv.querySelector("a")

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

const buttonStep1 = document.querySelector("#btn-step1")
buttonStep1.addEventListener("click", () => {
  phixer = new Phixer(inputFiles)
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
})