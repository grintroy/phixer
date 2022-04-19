class Phixer {

	constructor(input) {

		this.input = input

		console.log("Phixer is initialized. Files: " + input.length)

		this.loaded = new EventTarget()

		if (!input) {
			console.warn(`Phixer needs an input when initializing`)
			return
		}

		Tone.start()

		this.takes = []
		this.preferences = {
			"inPoint": 0, // in seconds
			"outPoint": 5, // in seconds
			"duration": 5, // in seconds
			"targetLCC": 1, // target linear corellation coefficient
			"analysisSampleRate": 48000, // in samples per second
			"primaryTrack": 0, // index in the takes array
			"fadeTime": 0.02 // in seconds
		}

		this.context = new Tone.Context()
		this.readFiles(this.input)
	}

	initPlayer() {
		this.player = new Phixer.Player(this)
	}

	static Take = class {
		constructor(parent, name, buffer, duration, sampleRate) {
			this.name = name
			this.arrayBuffer = buffer
			this.duration = duration // in seconds
			this.sampleRate = sampleRate
			this.parent = parent

			this.audioBuffer = parent.convertToAudioBuffer(buffer, duration, sampleRate)
		}

		initPlayer() {
			this.player = new Tone.Player(this.audioBuffer, this.onload()).toDestination()
			this.player.fadeIn = 0.03
			this.player.fadeOut = 0.2
			this.parent.player.connect(this.parent.takes[0])
		}

		onload() {
			console.log(this.name + " is loaded.")
			this.parent.initPlayer()
		}
	}

	static Player = class {
		constructor(parent) {

			this.parent = parent

			this.button = document.getElementById("player-button")

			this.updatePoints()

			this.takeNum = 1

		}

		updatePoints() {
			this.inPoint = this.parent.preferences.inPoint
			this.outPoint = this.parent.preferences.outPoint
			this.duration = this.parent.preferences.duration
		}

		connect(take) {
			try {
				this.connectedTonePlayer.unsync()
			} catch { }
			this.connectedTake = take
			this.connectedTonePlayer = take.player
			this.connectedTonePlayer.sync().start()
			this.parent.loaded.dispatchEvent(new Event("loaded"))
		}
	}

	readFiles(files) {

		let newTake

		const nameNumbersSF = 2 // significant figures for the take name index

		// https://codepen.io/dmack/pen/VLxpyv

		for (let file of files) {
			const fileReader = new FileReader
			fileReader.readAsArrayBuffer(file)
			fileReader.onload = () => {
				console.log(`Read from the input. Filename: '${file.name}' (${(Math.floor(file.size / 1024 / 1024 * 100)) / 100} MB)`)
				this.context.decodeAudioData(fileReader.result).then((buffer) => {

					for (let channel = 0; channel < buffer.numberOfChannels; channel++) {

						// The input file can be multichannel but it needs to include only one "." symbol

						const filename = file.name.split(".")[0] + "_" + (channel + 1).toString().padStart(nameNumbersSF, "0")

						newTake = new Phixer.Take(this, filename, buffer.getChannelData(channel), buffer.duration, buffer.sampleRate)

						this.takes.push(newTake)

						newTake.initPlayer()
					}
				})
			}
		}
	}

	convertToAudioBuffer(arrayBuffer, duration, sampleRate) {

		let audioBuffer = this.context.createBuffer(1, duration * sampleRate, sampleRate)
		for (var i = 0; i < arrayBuffer.length; i++) {
			audioBuffer.getChannelData(0)[i] = arrayBuffer[i]
		}
		return audioBuffer

	}

	analysePhase(takes) {

		let streams = []

		for (let take of takes) {
			streams.push(this.changeLength(this.resample(take)))
		}

		return this.corellationValue(streams)

	}

	resample(take) {

		const stream = take.arrayBuffer

		let newStream = []

		const resampleCoef = 1 / (1 / take.sampleRate * this.preferences.analysisSampleRate)

		for (let sampleCounter = 0; sampleCounter < stream.length / resampleCoef; sampleCounter++) {
			newStream.push(stream[Math.floor(sampleCounter * resampleCoef)])
		}

		return newStream

	}

	changeLength(stream) {

		// Change length according to in and out points given in preferences and the sampling rate for analysis
		return stream.slice(this.preferences.inPoint * this.preferences.analysisSampleRate, this.preferences.outPoint * this.preferences.analysisSampleRate)

	}

	corellationValue(streams) {

		let length = streams[0].length

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

		return (corSumOfProducts / Math.sqrt(corProductOfSums))
	}
}
