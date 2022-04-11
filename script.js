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

function button() {

  document.getElementById("result").innerHTML = phixer.analysePhase(phixer.takes)

  // const player2 = new Tone.Player(Phixer.convertToAudioBuffer(phixer.resample(phixer.takes[0]), phixer.takes[0].duration, phixer.preferences.analysisSampleRate), console.log("loaded")).toDestination()
  // player2.start()


  // let player2 = new Tone.Player(Phixer.convertToAudioBuffer(phixer.resample(phixer.takes[0]), phixer.takes[0].duration, phixer.takes[0].sampleRate), "New is loaded")

}
