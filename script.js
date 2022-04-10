const audioContext = new AudioContext()

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

function setup() {

}

function draw() {

}

function keyPressed() {

  // console.log(Phixer.takes[0].player._buffer._buffer[1246464])


  // switch (keyCode) {
  //   case LEFT_ARROW:
  //     Phixer.takes[0].player.toDestination()
  //     Tone.start()
  //     break;
  //   case RIGHT_ARROW:

  //     break;
  // }
}
