class Phixer {
	constructor(input) {
		this.input = input

		console.log("Phixer is initialized. Files: " + input.length)

		if (!input) {
			console.warn(`Phixer needs an input when initializing`)
			return
		}

		Tone.start()

		this.takes = []
		this.preferences = {
			// default
			inPoint: 0, // in seconds
			outPoint: 5, // in seconds
			duration: 5, // in seconds
			targetLCC: 0.5, // target linear corellation coefficient
			analysisSampleRate: 48000, // in samples per second
			originalSampleRate: 48000,
			primaryTake: 0, // index in the takes array
			fadeTime: 0.02, // in seconds
			outputFormat: "none",
			maxDisplacement: 0.01 // in seconds (maximum displacement of nudged takes)
		}
	}

	static Progress = class {
		constructor() {
			this.resolution = 8
			this.sampledPos = undefined
		}

		show(value, min, max) {
			const v = value - min
			const range = max - min
			const position = v / range
			const tmp = Math.floor(position * this.resolution)
			if (this.sampledPos !== tmp) {
				this.sampledPos = tmp
				const blank = this.resolution - this.sampledPos
				console.log(
					"Progress: [ " + "■ ".repeat(this.sampledPos) + "□ ".repeat(blank) + "]"
				)
			}
		}

		done() {
			this.show(1, 0, 1)
			this.sampledPos = undefined
		}
	}

	phix() {
		return new Promise((resolve, reject) => {
			const promise = new Promise((resolve, reject) => {
				const progress = new Phixer.Progress()
				try {
					this.buffers = []
					this.takes.forEach((take) => {
						this.buffers.push(take.arrayBuffer)
					})
					this.preferences.originalSampleRate = this.takes[0].sampleRate
					const initialAnalysis = this.analysePhase(
						this.buffers,
						this.preferences.originalSampleRate
					)
					initialAnalysis.lcc = initialAnalysis.lcc.toFixed(2)
					const newTakeBuffers = initialAnalysis.buffers

					this.result = {
						closestLCC: initialAnalysis.lcc,
						buffers: this.buffers,
						nudge: [0, 0]
					}

					console.log("Original LCC: " + initialAnalysis.lcc)

					Array.prototype.slide = function (value) {
						if (value == 0) return this
						const segment1 = this.slice(0, -value)
						const segment2 = this.slice(-value)
						return segment2.concat(segment1)
					}

					const maxDispSamples =
						this.preferences.maxDisplacement *
						this.preferences.analysisSampleRate

					console.log("Maximum displacement for matching: " + maxDispSamples)

					const nudgeMatrixTemplate = new Array(this.takes.length).fill(1)
					nudgeMatrixTemplate[this.preferences.primaryTake] = 0

					for (
						let i = 0, incr = 1;
						Math.abs(i) <= maxDispSamples;
						i += incr, incr = -1 * incr - Math.sign(incr)
					) {
						progress.show(Math.abs(i), 0, maxDispSamples)
						let preparedMatrix = new Array(this.takes.length).fill(undefined)
						preparedMatrix.forEach((cell, n) => {
							preparedMatrix[n] = i * nudgeMatrixTemplate[n]
						})

						const preparedStreams = nudgeAndTrim(preparedMatrix)
						const analysisResults = this.analysePhase(
							preparedStreams,
							true,
							this.preferences.analysisSampleRate
						)

						if (
							Math.abs(
								analysisResults.lcc.toFixed(2) - this.preferences.targetLCC
							) < Math.abs(this.result.closestLCC - this.preferences.targetLCC)
						) {
							this.result.closestLCC = analysisResults.lcc
							this.result.buffers = analysisResults.buffers
							this.result.nudge = preparedMatrix
							if (
								analysisResults.lcc.toFixed(2) == this.preferences.targetLCC
							) {
								console.log("Matched to two decimal places.")
								break
							}
						}
					}

					progress.done()
					this.result.initialLCC = initialAnalysis.lcc

					console.log(this.result)
					resolve()

					function nudgeAndTrim(nudgeMatrix) {
						const result = []
						let maxSlide = Math.max.apply(null, nudgeMatrix)
						let minSlide = Math.min.apply(null, nudgeMatrix)
						nudgedPhase(nudgeMatrix).forEach((stream) => {
							if (minSlide > -1) minSlide = undefined
							result.push(stream.slice(maxSlide, minSlide))
						})
						return result
					}

					function nudgedPhase(nudges) {
						const nudgedStreams = []
						nudges.forEach((nudge, i) => {
							nudgedStreams.push(newTakeBuffers[i].slide(nudge))
						})
						return nudgedStreams
					}
				} catch (error) {
					console.error(error)
				}
			})

			promise
				.then(() => resolve())
				.catch((e) => {
					this.initError(e)
					reject()
				})
		})
	}

	checkLoaded() {
		return new Promise((resolve, reject) => {
			const promise = this.readFiles(this.input)
			promise
				.then(() => resolve())
				.catch((e) => {
					this.initError(e)
					reject()
				})
		})
	}

	checkPreferences() {
		return new Promise((resolve, reject) => {
			const promise = new Promise((resolve, reject) => {
				if (this.preferences.inPoint < 0 || this.preferences.outPoint < 0)
					reject("in/out point.")
				if (this.preferences.outPoint - this.preferences.inPoint > 60)
					reject("duration is over 60 seconds.")
				if (
					this.preferences.outPoint - this.preferences.inPoint !=
					this.preferences.duration
				)
					reject("duration does not match to in/out points.")
				if (this.preferences.targetLCC < 0 || this.preferences.targetLCC > 1)
					reject("targetLCC is out of range.")
				if (
					this.preferences.analysisSampleRate < 3000 ||
					this.preferences.analysisSampleRate >
						this.takes[this.preferences.primaryTake].sampleRate
				)
					reject("analysisSampleRate is out of range.")
				if (
					this.preferences.primaryTake < 0 ||
					this.preferences.primaryTake >= this.takes.length
				)
					reject("primaryTake is out of range.")
				if (!["none", "wav", "mp3"].includes(this.preferences.outputFormat))
					reject("outputFormat out of range.")
				resolve()
			})

			promise
				.then(() => resolve())
				.catch((e) => {
					this.initError("Invalid preferences: " + e)
					reject()
				})
		})
	}

	initError(e) {
		this.error = new Error(e)
		console.error(this.error)
		try {
			this.context.dispose()
			console.warn("The OfflineContext has been disposed.")
		} catch (e) {}
	}

	initPlayer() {
		this.player = new Phixer.Player(this)
	}

	updateDuration() {
		this.preferences.duration =
			this.preferences.outPoint - this.preferences.inPoint
	}

	static Take = class {
		constructor(parent, name, buffer, duration, sampleRate) {
			this.name = name
			this.arrayBuffer = buffer
			this.duration = duration // in seconds
			this.sampleRate = sampleRate
			this.parent = parent

			this.audioBuffer = parent.convertToAudioBuffer(
				buffer,
				duration,
				sampleRate
			)
		}

		initPlayer() {
			this.player = new Tone.Player(
				this.audioBuffer,
				this.onload()
			).toDestination()
			this.player.fadeIn = 0.03
			this.player.fadeOut = 0.07
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
			} catch {}
			this.connectedTake = take
			this.connectedTonePlayer = take.player
			this.connectedTonePlayer.sync().start()
			this.sampleRate = take.sampleRate
		}
	}

	readFiles(files) {
		const promise = new Promise((resolve, reject) => {
			let newTake
			const nameNumbersSF = 2 // significant figures for the take name index

			if (files.length === 0) reject("No files uploaded.")

			// https://codepen.io/dmack/pen/VLxpyv

			let fileCount = 1

			for (const file of files) {
				const fileReader = new FileReader()
				fileReader.readAsArrayBuffer(file)

				const fileExtension = file.name.split(".").pop().toLowerCase()
				fileReader.onload = () => {
					try {
						console.log(
							`Read from the input. Filename: '${file.name}' (${
								Math.floor((file.size / 1024 / 1024) * 100) / 100
							} MB)`
						)

						if (fileExtension !== "wav") throw "Unsupported file format."

						const fileProperties = this.readProperties(fileReader.result)

						this.context = new Tone.OfflineContext(
							1,
							fileProperties.duration,
							fileProperties.sampleRate
						)
						this.context.decodeAudioData(fileReader.result).then((buffer) => {
							for (
								let channel = 0;
								channel < buffer.numberOfChannels;
								channel++
							) {
								// The input file can be multichannel but it needs to include only one "." symbol

								const filename =
									file.name.split(".")[0] +
									"_" +
									(channel + 1).toString().padStart(nameNumbersSF, "0")

								newTake = new Phixer.Take(
									this,
									filename,
									buffer.getChannelData(channel),
									buffer.duration,
									buffer.sampleRate
								)

								this.takes.push(newTake)
								newTake.initPlayer()
							}
							try {
								if (this.takes.length > 2)
									throw "The total channel count is over two. Phixer only works with 2 channels at the moment."
								if (files.length === fileCount) resolve()
								fileCount++
							} catch (e) {
								reject(e)
							}
						})
					} catch (e) {
						reject(e)
					}
				}
			}
		})

		return promise
	}

	readProperties(buffer) {
		// https://github.com/WebAudio/web-audio-api/issues/30#issuecomment-1090167849

		const view = new DataView(buffer)
		const chunkCellSize = 4

		const getChunkName = (newOffset) =>
			String.fromCharCode.apply(
				null,
				new Int8Array(buffer.slice(newOffset, newOffset + chunkCellSize))
			)

		const isWave = getChunkName(0).includes("RIFF")
		if (!isWave) throw new Error("Unsupported file format.")

		let offset = 12
		let chunkName = getChunkName(offset)
		let chunkSize = 0

		while (!chunkName.includes("fmt")) {
			chunkSize = view.getUint32(offset + chunkCellSize, true)
			offset += 2 * chunkCellSize + chunkSize // name cell + data_size cell + data size
			chunkName = getChunkName(offset)

			if (offset > view.byteLength) throw new Error("Couldn't find sampleRate.")
		}

		const sampleRateOffset = 12
		const coeffOffset = 20
		const dataSizeOffset = 28

		const sampleRate = view.getUint32(offset + sampleRateOffset, true)
		const coeff = view.getUint16(offset + coeffOffset, true)
		const dataSize = view.getUint32(offset + dataSizeOffset, true)
		const duration = dataSize / coeff / sampleRate // in seconds

		return { sampleRate: sampleRate, duration: duration }
	}

	convertToAudioBuffer(arrayBuffer, duration, sampleRate) {
		let audioBuffer = this.context.createBuffer(
			1,
			duration * sampleRate,
			sampleRate
		)
		for (var i = 0; i < arrayBuffer.length; i++) {
			audioBuffer.getChannelData(0)[i] = arrayBuffer[i]
		}
		return audioBuffer
	}

	analysePhase(buffers, keepOriginal, sampleRate) {
		let streams = []

		if (keepOriginal !== true) {
			sampleRate = keepOriginal
			for (let buffer of buffers) {
				streams.push(
					this.resample(this.changeLength(buffer, sampleRate), sampleRate)
				)
			}
		} else streams = buffers
		return { lcc: this.corellationValue(streams), buffers: streams }
	}

	resample(stream, sampleRate) {
		let newStream = []

		const resampleCoef = sampleRate / this.preferences.analysisSampleRate

		for (
			let sampleCounter = 0;
			sampleCounter < stream.length / resampleCoef;
			sampleCounter++
		) {
			newStream.push(stream[Math.floor(sampleCounter * resampleCoef)])
		}

		return newStream
	}

	changeLength(stream, sampleRate) {
		return stream.slice(
			this.preferences.inPoint * sampleRate,
			this.preferences.outPoint * sampleRate
		)
	}

	corellationValue(streams) {
		const length = streams[0].length
		const numOfStreams = streams.length

		// Calculation of the sum of the products and the product of sums of squares following the original formula.
		const numerator = new Array(length).fill(1)
		const denominator = new Array(numOfStreams).fill(0)

		for (let i = 0; i < length; i++) {
			for (let n = 0; n < numOfStreams; n++) {
				numerator[i] *= streams[n][i]
				denominator[n] += Math.pow(streams[n][i], numOfStreams)
			}
		}

		const corSumOfProducts = numerator.reduce(
			(previousValue, currentValue) => previousValue + currentValue,
			0 // initial value
		)
		const corProductOfSums = denominator.reduce(
			(previousValue, currentValue) => previousValue * currentValue,
			1 // initial value
		)

		Math.realPow = function (x, y) {
			// https://stackoverflow.com/questions/14575697/math-pow-with-negative-numbers-and-non-integer-powers?noredirect=1&lq=1
			if (x > 0) return Math.pow(x, y)
			return -1 * Math.pow(-x, y)
		}

		return corSumOfProducts / Math.realPow(corProductOfSums, 1 / numOfStreams)
	}
}
