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

const phixer = new Phixer()

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
      phixer.takes[1].player.start()
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

//
