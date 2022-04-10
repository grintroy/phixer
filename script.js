const preferences = {
  "inPoint": 0, // in seconds
  "outPoint": 3, // in seconds
  "duration": 3, // in seconds
  "targetLCC": 1, // target linear corellation coefficient
  "samplingRate": 100, // in samples per second
  "primaryTrack": 0, // index in the takes array
  "fadeTime": 0.02 // in seconds
}

const nameNumbersSF = 3

const audioContext = new AudioContext()

let takes = []

class Phixer {

  static Take = class {
    constructor(buffer, name) {
      this.name = name
      this.player = new Tone.Player(buffer, console.log(`${this.name} is loaded to the Player`))
      this.buffer = this.player._buffer._buffer
    }
  }

  static analysePhase(streams) { // streams is an array of audio buffers

  }

  static isSameLength(streams) { // streams is an array of audio buffers
    
    // Set the target buffer length by the length of the first item in the source array
    
    const targetLength = streams[0].length

    // Iterate over other items (not including the first one), abort and return false is length differs. Otherwise return true

    for (let i = 1; i < streams.length; i++) {
      if (targetLength !== streams[i].length) return false
    }
    return targetLength
  }

  static corellationValue(streams) {
  
    // Check the length
  
    let length = this.isSameLength(streams)
    if (!length) return 0 // CHECK IF WORKING

    // Calculation of the sum of the products and the product of sums of squares following the original formula.

    let numerator = new Array(length).fill(1)
    let denominator = new Array(streams.length).fill(0)

    for (let i = 0; i < length; i++) {
      for (let n = 0; n < streams.length; n++) {
        numerator[i] *= streams[n][i]
        denominator[n] += Math.pow(streams[n][i], 2)
      }
    } // check and explain

    const corSumOfProducts = numerator.reduce(
      (previousValue, currentValue) => previousValue + currentValue,
      0 // initial value
    )
    const corProductOfSums = denominator.reduce(
      (previousValue, currentValue) => previousValue * currentValue,
      1 // initial value
    )

    console.log(corSumOfProducts, corProductOfSums)

    return (corSumOfProducts / Math.sqrt(corProductOfSums))
  }
}

{
  // Test. Populate two arrays with sine wave values.

  const audio1 = []
  const audio2 = []
  const phaseDifference =  30 * (Math.PI / 180) // in radians
  const sampleRate = 3  // samples per second
  
  for (let t = 0; t < 5; t += 1/sampleRate) {
      audio1.push(sinDisplacement(1, 1.2, t, 0))
      audio2.push(sinDisplacement(1, 1.2, t, phaseDifference))
  }
  
  console.log(audio1, audio2)
  
  console.log(Phixer.corellationValue([audio1, audio2]))
  
  function sinDisplacement(A, freq, t, phi) {
    return A * Math.sin(2 * Math.PI * freq * t + phi)
  }
}

function readFile(files) {

  // https://codepen.io/dmack/pen/VLxpyv

  for (let file of files) {
    const fileReader = new FileReader
    fileReader.readAsArrayBuffer(file)
    fileReader.onload = () => {
      console.log(`Read from the input. Filename: '${file.name}' (${(Math.floor(file.size/1024/1024*100))/100} MB)`)
      audioContext.decodeAudioData(fileReader.result, (buffer) => {
        for (var channel = 0; channel < buffer.numberOfChannels; channel++) {

          // The input file can be multichannel but it needs to include only one "." symbol
          takes.push(new Phixer.Take(buffer.getChannelData(channel), file.name.split(".")[0] + "_" + channel.toString().padStart(nameNumbersSF, "0")))
        }
      })
    }
  }
}

function setup() {

}

function draw() {

}

function keyPressed() {
  // console.log(takes[0].buffer);
  console.log()
}
