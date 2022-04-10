class Phixer {

	static takes = []

  static Take = class {
    constructor(buffer, name) {
      this.name = name
      this.player = new Tone.Player(buffer, console.log(`${this.name} is loaded to the Player`))
      this.buffer = this.player._buffer._buffer
      this.sampleTime = Tone.Transport.sampleTime
    }
  }

  static preferences = {
    "inPoint": 0, // in seconds
    "outPoint": 3, // in seconds
    "duration": 3, // in seconds
    "targetLCC": 1, // target linear corellation coefficient 
    "analysisSampleRate": 100, // in samples per second
    "primaryTrack": 0, // index in the takes array
    "fadeTime": 0.02 // in seconds
  }

	static readFile(files) {

		const nameNumbersSF = 2 // significant figures for the take name index

		// https://codepen.io/dmack/pen/VLxpyv
	
		for (let file of files) {
			const fileReader = new FileReader
			fileReader.readAsArrayBuffer(file)
			fileReader.onload = () => {
				console.log(`Read from the input. Filename: '${file.name}' (${(Math.floor(file.size/1024/1024*100))/100} MB)`)
				audioContext.decodeAudioData(fileReader.result, (buffer) => {
					for (var channel = 0; channel < buffer.numberOfChannels; channel++) {

						// The input file can be multichannel but it needs to include only one "." symbol
						Phixer.takes.push(new Phixer.Take(buffer.getChannelData(channel), file.name.split(".")[0] + "_" + (channel + 1).toString().padStart(nameNumbersSF, "0")))
					}
				})
			}
		}
	}

  static analysePhase(streams) {

    for (let stream of streams) {
      stream = this.changeLength(stream)
    }

  }

  static resample(take) {

		const stream = take.buffer
		let newStream = []

		const resampleCoef = 1 / (take.sampleTime * this.preferences.analysisSampleRate)

		for (let sampleCounter = 0; sampleCounter < stream.length / resampleCoef; sampleCounter++) {
			newStream.push(stream[Math.floor(sampleCounter * resampleCoef)])
		}

		return newStream

  }

  static changeLength(stream) {

    // Change length according to in and out points given in preferences and the sampling rate for analysis
    return stream.slice(this.preferences.inPoint * this.preferences.analysisSampleRate, this.preferences.outPoint * this.preferences.analysisSampleRate)

  }

  static corellationValue(streams) {

    let length = streams.length

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