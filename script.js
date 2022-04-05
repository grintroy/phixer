{
  // // Test. Populate two arrays with sine wave values.
  // const audio1 = []
  // const audio2 = []
  // const phaseDifference =  45 * (Math.PI / 180) // in radians
  // const sampleRate = 44100  // samples per second
  //
  // for (let t = 0; t < 5; t += 1/sampleRate) {
  //     audio1.push(sinDisplacement(1, 1, t, 0))
  //     audio2.push(sinDisplacement(1, 1, t, phaseDifference))
  // }
  //
  // // console.log(audio1, audio2)
  //
  // console.log(corellationValue(audio1, audio2, 5))
  //
  // function sinDisplacement(A, freq, t, phi) {
  //   return A * Math.sin(2 * Math.PI * freq * t + phi)
  // }
}

function setup() {

}

function draw() {

}

function corellationValue(channel1, channel2, precision) {

  // A channel1 and a channel2 need to be the arrays of the same length with data about the amplitude (-1 > 1) of the audio in those channels. Needs to be a typed array. The precision is the amount of decimal places

  // Check the length

  if (channel1.length !== channel2.length) return 0

  // Calculate the sum of the products.

  let corSumOfProducts = 0
  for (let i = 0; i < channel1.length; i++) {
    corSumOfProducts += channel1[i] * channel2[i]
  }

  // Calculate the sums of squares (separately).

  const corSqVal1 = channel1.reduce(
    (previousValue, currentValue) => previousValue + Math.pow(currentValue, 2),
    0 // initial value
  )
  const corSqVal2 = channel2.reduce(
    (previousValue, currentValue) => previousValue + Math.pow(currentValue, 2),
    0 // initial value
  )

  return (corSumOfProducts / Math.sqrt(corSqVal1 * corSqVal2)).toFixed(precision)
}
