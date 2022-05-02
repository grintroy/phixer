const inputFiles = []

let phixer, playerWavElement, playerWavProgress, playheadController, playerButton, renderPlayer

const MAXDURATION = 60
const SAMPLERATERANGE = {
	min: 3000,
	max: undefined
}

Number.prototype.map = function (in_min, in_max, out_min, out_max) {
	// From https://gist.github.com/xposedbones/75ebaef3c10060a3ee3b246166caab56
	return ((this - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min
}

class PlayerButton {
	constructor(element) {
		this.element = element
		element.onclick = () => {
			const state = Tone.Transport.state
			if (state === "stopped" && phixer.preferences.duration > 0) {
				this.start()
			} else if (state === "started") {
				this.stop()
			}
		}

		phixer.takes.forEach((take) => {
			take.player.onstop = () => {
				this.stop()
			}
		})

		this.updateConnection()
		this.buttonElement = element
		this.playButton = element.querySelector("[phixer-player-button='play']")
		this.stopButton = element.querySelector("[phixer-player-button='stop']")
	}

	updatePlayheadController() {
		const secPos = Tone.now() - this.now
		const value = secPos / phixer.preferences.duration

		playheadController.clipPath = `inset(0 ${100 * (1 - value)}% 0 0)`
	}

	updateConnection() {
		this.player = phixer.player
		this.player.connect(phixer.player.connectedTake)
	}

	start() {
		this.playButton.hidden = true
		this.buttonElement.style.backgroundColor = "black"
		this.stopButton.hidden = false
		this.durationCoef = 1 / phixer.preferences.duration
		this.now = Tone.now()
		Tone.Transport.start(this.now, phixer.preferences.inPoint).stop(
			this.now + phixer.preferences.duration
		)
		playheadController.opacity = 1
		playerWavProgress.style.borderWidth = 5
	}

	stop() {
		playheadController.opacity = 0
		this.playButton.hidden = false
		this.buttonElement.style.backgroundColor = "rgb(var(--bs-primary-rgb))"
		this.stopButton.hidden = true
		Tone.Transport.stop()
	}
}

const uploadFilesDiv = document.querySelector("#upload-files-div")
const uploadFilesInput = uploadFilesDiv.querySelector("#upload-files-input")
const uploadFilesLink = uploadFilesDiv.querySelector("a")
const uploadWindow = document.querySelector("#upload-window")
const spinnerContainer = document.querySelector("#spinner-container")
const footer = document.querySelector("#footer")
const errorWindow = document.querySelector("#error")
const resultsWindow = document.querySelector("#results")

const initButtonStep = {
	1: () => {
		playerWavElement = document.querySelector("#player")
		playerWavProgress = document.querySelector("#player-progress")
	},
	2: () => {
		playerButton.stop()
		window.removeEventListener("resize", renderPlayer)
	},
	3: () => {
		console.log("Current preferences:", phixer.preferences)
	}
}

const initStep = {
	0: () => {
		errorWindow.querySelector("code").innerHTML = phixer.error
	},
	1: () => {
		uploadWindow.ondrop = (e) => dropHandler(e)
		uploadWindow.ondragover = (e) => dragOverHandler(e)
		uploadWindow.ondragleave = (e) => dragLeaveHandler(e)

		// From https://stackoverflow.com/questions/35659430/how-do-i-programmatically-trigger-an-input-event-without-jquery
		// and https://stackoverflow.com/questions/11406605/how-to-make-a-link-act-as-a-file-input

		uploadFilesLink.addEventListener("click", (e) => {
			e.preventDefault()
			uploadFilesInput.dispatchEvent(new Event("click"))
		})

		uploadFilesInput.addEventListener("change", (e) => {
			for (const file of e.target.files) {
				inputFiles.push(file)
				console.log("File(s) uploaded: " + file.name)
			}
			document.querySelector("#uploadedFilesCount").innerHTML = inputFiles.length
		})

		// From https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop

		function dropHandler(event) {
			console.log("File(s) dropped")

			// Prevent default behavior (Prevent file from being opened)
			event.preventDefault()

			if (event.dataTransfer.items) {
				// Use DataTransferItemList interface to access the file(s)
				for (let i = 0; i < event.dataTransfer.items.length; i++) {
					// If dropped items aren't files, reject them
					if (event.dataTransfer.items[i].kind === "file") {
						const tmpFile = event.dataTransfer.items[i].getAsFile()
						inputFiles.push(tmpFile)
						console.log("... file[" + i + "].name = " + tmpFile.name)
					}
				}
			} else {
				// Use DataTransfer interface to access the file(s)
				for (let i = 0; i < event.dataTransfer.files.length; i++) {
					console.log("... file[" + i + "].name = " + event.dataTransfer.files[i].name)
				}
			}

			uploadWindow.style.borderWidth = null
			uploadWindow.style.cursor = "default"
			document.querySelector("#uploadedFilesCount").innerHTML = inputFiles.length
		}

		function dragOverHandler(event) {
			document
				.querySelector("#upload-window")
				.setAttribute("style", "border-width: 0.5rem !important; cursor: copy;")

			// Prevent default behavior (Prevent file from being opened)
			event.preventDefault()
		}

		function dragLeaveHandler(event) {
			uploadWindow.style.borderWidth = null
			uploadWindow.style.cursor = "default"

			// Prevent default behavior (Prevent file from being opened)
			event.preventDefault()
		}
	},
	2: () => {
		const allRanges = document.querySelectorAll(".range-wrap")
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

		playerButton = new PlayerButton(document.getElementById("player-button"))
		document.getElementById("2-3-2-number").placeholder = phixer.player.sampleRate

		allRanges.forEach((wrap) => {
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

			bubble.style.left = `calc(${val}% - ${(val / 50 - 1) * 3}rem - ${
				(val / 50 - 1) * 1
			}rem - ${halfWidth}px)`
		}

		{
			// Takes dropdown initialization

			try {
				console.log(`Current connection (default): ${phixer.takes[0].name}.`)

				const takesDropdown = document.querySelector("#takes-dropdown")

				if (phixer.takes) takesDropdown.innerHTML = ""

				phixer.takes.forEach((take) => {
					takesDropdown.innerHTML += `<li><a class="dropdown-item" href="#/">${take.name}</a></li>`
				})

				takesDropdown.querySelectorAll("li a")[0].classList.add("active")

				takesDropdown.querySelectorAll("li a").forEach((option, i) => {
					option.addEventListener("click", () => {
						Tone.Transport.stop()
						phixer.player.connect(phixer.takes[i])
						playerWavElement.dispatchEvent(new Event("inputChanged"))
						phixer.preferences.primaryTake = i
						phixer.preferences.takeToNudge = 1 - i
						console.log(`Current connection: ${phixer.takes[i].name}.`)

						try {
							playerButton.updateConnection()
						} catch {}

						takesDropdown.querySelectorAll("li a").forEach((item) => {
							item.classList.remove("active")
						})

						takesDropdown.querySelectorAll("li a")[i].classList.add("active")
					})
				})
			} catch {}
		}

		{
			// p5 waveform

			mainWaveform = (p) => {
				p.setup = () => {
					p.noCanvas()
					drawWaveform()

					// Schedule re-render when the window is resized

					window.addEventListener("resize", renderPlayer)
					playerWavElement.addEventListener("inputChanged", renderPlayer)
				}

				p.draw = () => {
					p.loop()
					if (Tone.Transport.state === "started") {
						playerButton.updatePlayheadController()
					}
				}

				renderPlayer = function () {
					drawWaveform()
					progressWavCanvasInit()
				}

				function drawWaveform() {
					p.remove()

					const elWidth = playerWavElement.clientWidth
					const elHeight = playerWavElement.clientHeight

					p.createCanvas(elWidth, elHeight)

					const bandWidth = 6 // in pixels
					p.stroke(204, 204, 204)
					p.strokeWeight(bandWidth / 2)
					const data = phixer.player.connectedTake.arrayBuffer

					const sampleRate = phixer.player.connectedTake.sampleRate

					const inpoint = phixer.preferences.inPoint // in sec
					const inpointSamples = inpoint * sampleRate
					const outpoint = phixer.preferences.outPoint // in sec
					const outpointSamples = outpoint * sampleRate
					const durationSamples = outpointSamples - inpointSamples

					const yMargin = 10 // in px, distance from the loudest point to the border of the canvas
					const yMarginCoef = (elHeight - yMargin * 2) / elHeight

					const newData = data.slice(inpointSamples, outpointSamples)

					const pixelToSampleRatio = durationSamples / elWidth
					const waveformLookahead = bandWidth * pixelToSampleRatio // in samples

					let emptySpacePointX
					let emptySpaceLinesArray = []
					let lineHeightsArray = []
					const emptySpaceHeight = elHeight - yMargin * 2

					for (let i = 0; i < durationSamples; i += bandWidth * pixelToSampleRatio) {
						const pixelX = i / pixelToSampleRatio

						if (i < newData.length) {
							const valSum = newData
								.slice(Math.floor(i), Math.floor(i + waveformLookahead))
								.reduce((prevVal, curVal) => Math.abs(prevVal) + Math.abs(curVal), 0)
							const meanVal = valSum / waveformLookahead
							const lineHeight = meanVal * yMarginCoef * elHeight
							lineHeightsArray.push(lineHeight)
						} else if (!emptySpacePointX) {
							emptySpacePointX = pixelX
							break
						}
					}

					// Normalize the displayed signal

					const max = Math.max.apply(null, lineHeightsArray)
					const normalizationCoef = (yMarginCoef * elHeight) / max
					lineHeightsArray.forEach((line, i) => {
						lineHeightsArray[i] *= normalizationCoef
					})

					for (let i = 0, j = 0; i < newData.length; i += bandWidth * pixelToSampleRatio, j++) {
						const pixelX = i / pixelToSampleRatio
						const margin = (elHeight - lineHeightsArray[j]) / 2
						p.line(pixelX, margin, pixelX, margin + lineHeightsArray[j])
					}

					// Create a box indicating the end of the take

					for (let i = -emptySpaceHeight + emptySpacePointX; i < elWidth; i += bandWidth * 2) {
						emptySpaceLinesArray.push({
							x1: i,
							y1: yMargin + emptySpaceHeight,
							x2: i + emptySpaceHeight,
							y2: yMargin
						})
					}

					if (emptySpacePointX < elWidth) {
						emptySpaceLinesArray.forEach((line) => {
							if (line.x1 < emptySpacePointX) {
								const diff = emptySpacePointX - line.x1
								line.x1 = emptySpacePointX
								line.y1 -= diff
							}
							p.line(line.x1, line.y1, line.x2, line.y2)
						})

						p.fill(0, 0)
						p.rect(
							emptySpacePointX,
							yMargin,
							elWidth - emptySpacePointX + bandWidth / 2,
							elHeight - yMargin * 2
						)
					}
				}
			}

			const p5js1 = new p5(mainWaveform, playerWavElement)

			const parentElement = playerWavProgress
			const oldCanvasElement = document.querySelector(".p5Canvas")
			progressWavCanvasInit()
			playheadController = parentElement.style

			function progressWavCanvasInit() {
				document.querySelectorAll(".dup-canvas").forEach((e) => {
					e.remove()
				})
				const newCanvasCopy = cloneCanvas(oldCanvasElement)
				const newCanvasElement = parentElement.insertBefore(
					newCanvasCopy,
					parentElement.querySelector("#player-progress-bg")
				)
				newCanvasElement.style.cssText = oldCanvasElement.style.cssText
				newCanvasElement.style.position = "absolute"
				newCanvasElement.classList.add("dup-canvas")
			}

			function cloneCanvas(oldCanvas) {
				// From https://stackoverflow.com/questions/3318565/any-way-to-clone-html5-canvas-element-with-its-content
				// and https://stackoverflow.com/questions/45706829/change-color-image-in-canvas

				// create a new canvas
				var newCanvas = document.createElement("canvas")
				var context = newCanvas.getContext("2d")

				// set dimensions
				newCanvas.width = oldCanvas.width
				newCanvas.height = oldCanvas.height

				// apply the old canvas to the new one
				context.drawImage(oldCanvas, 0, 0)

				context.globalCompositeOperation = "source-in"

				const color = getComputedStyle(document.documentElement).getPropertyValue(
					"--bs-primary-rgb"
				) // From https://davidwalsh.name/css-variables-javascript
				context.fillStyle = `rgb(${color})`
				context.fillRect(0, 0, newCanvas.width, newCanvas.height)

				// return the new canvas
				return newCanvas
			}
		}

		{
			// Listeners for player's in-out points and duration

			const inPointElement = document.querySelector("#in-point")
			const outPointElement = document.querySelector("#out-point")
			const durationField = document.querySelector("#take-duration p span")
			const durationBlock = document.querySelector("#take-duration")

			function updateValues(element, otherElement) {
				playerButton.stop()

				// From https://stackoverflow.com/questions/6649327/regex-to-remove-letters-symbols-except-numbers

				let value = element.value

				value = formatString(value)

				if (value.length > 4) {
					value = value.slice(0, 4)
				}

				value =
					"0".repeat(4 - value.length) +
					value.slice(0, value.length - 2) +
					value.slice(value.length - 2, value.length)

				const valueDisplay = value.slice(0, 2) + ":" + value.slice(2, 4)

				element.value = valueDisplay

				let minsec = formatDisplayToMinSec(value)

				const timeInSec = formatToSec(minsec.min, minsec.sec)

				const attribute = element.getAttribute("phixer-in-out-points")
				const attribute2 = otherElement.getAttribute("phixer-in-out-points")
				phixer.preferences[attribute] = timeInSec

				if (
					(attribute === "inPoint" && timeInSec > phixer.preferences.outPoint) ||
					(attribute === "outPoint" && timeInSec < phixer.preferences.inPoint) ||
					Math.abs(phixer.preferences[attribute] - phixer.preferences[attribute2]) > MAXDURATION
				) {
					phixer.preferences.duration = "—"
					durationBlock.classList.remove("bg-light")
					durationBlock.classList.remove("text-muted")
					durationBlock.classList.add("bg-danger")
					durationBlock.classList.add("text-light")
				} else {
					phixer.updateDuration()
					durationBlock.classList.add("bg-light")
					durationBlock.classList.add("text-muted")
					durationBlock.classList.remove("bg-danger")
					durationBlock.classList.remove("text-light")
				}

				phixer.player.updatePoints()

				durationField.innerHTML = phixer.preferences.duration

				playerWavElement.dispatchEvent(new Event("inputChanged"))
			}

			function formatToSec(min, sec) {
				// Convert time from mm:ss to seconds
				return min * 60 + sec
			}

			function formatDisplayToMinSec(value) {
				// Convert display format to minutes and seconds
				let min = Math.floor(value / 100)
				let sec = value - min * 100

				return { min: min, sec: sec }
			}

			function formatString(inputString) {
				// Delete any characters but numbers and remove leading zeros
				inputString = inputString.replace(/\D/g, "")
				while (inputString.charAt(0) == 0 && inputString) {
					inputString = inputString.slice(1, inputString.length)
				}
				return inputString
			}

			inPointElement.addEventListener("input", () => updateValues(inPointElement, outPointElement))
			outPointElement.addEventListener("input", () => updateValues(outPointElement, inPointElement))
		}

		phixer.preferences.analysisSampleRate = phixer.player.sampleRate / 2

		{
			// Listeners for preferences

			document.querySelectorAll(".input-number").forEach((field) => {
				field.addEventListener("change", () => {
					const attr = field.getAttribute("data-phixer-pref")
					let newValue

					if (attr === "targetLCC") {
						newValue = field.value.replace(/[^\d.]/g, "")
						if (newValue > 1) {
							newValue = 1
						}
						if (newValue < 0) {
							newValue = 0
						}
						if (newValue.length > 4) {
							newValue = newValue.slice(0, 4)
						}
					}

					if (attr === "analysisSampleRate") {
						newValue = field.value.replace(/\D/g, "")
						if (newValue > phixer.player.sampleRate) {
							newValue = phixer.player.sampleRate
						}
						if (newValue < SAMPLERATERANGE.min && newValue.length) {
							newValue = SAMPLERATERANGE.min
						}
					}

					field.value = newValue
					phixer.preferences[attr] = Number(newValue)
				})
			})

			document.querySelectorAll(".input-range").forEach((slider) => {
				slider.addEventListener("change", () => {
					const attr = slider.getAttribute("data-phixer-pref")
					let newValue

					if (attr === "targetLCC") {
						newValue = (slider.value / 100).toFixed(2)
					}

					if (attr === "analysisSampleRate") {
						newValue =
							Math.round(
								Number(slider.value).map(0, 100, SAMPLERATERANGE.min, phixer.player.sampleRate) /
									100
							) * 100
					}

					phixer.preferences[attr] = Number(newValue)
				})
			})
		}
	},
	3: () => {
		// This step is hidden since the rendering feature has not been implemented yet.

		// document.querySelectorAll('#step-3 input[name="output-format"]').forEach((radio) => {
		// 	radio.addEventListener("click", () => {
		// 		phixer.preferences.outputFormat = radio.getAttribute("phixer-output-format")
		// 	})
		// })

		initNextStep(null, 4)
		document.querySelector("#step-3").style.opacity = 0
		document.querySelector("#step-3").hidden = true
	},
	4: () => {
		resultsWindow.querySelector("#initial-lcc").innerHTML = phixer.result.initialLCC
		resultsWindow.querySelector("#result-lcc").innerHTML = Math.abs(
			phixer.result.closestLCC
		).toFixed(2)

		const takeToNudge = phixer.takes[phixer.preferences.takeToNudge]

		resultsWindow.querySelector("#take-name").innerHTML = takeToNudge.name

		if (Math.sign(phixer.result.nudge[phixer.preferences.takeToNudge]) < 0)
			resultsWindow.querySelector("#sign").innerHTML = "-"
		else resultsWindow.querySelector("#sign").innerHTML = "+"

		resultsWindow.querySelector("#samples").innerHTML = Math.abs(
			phixer.result.nudge[phixer.preferences.takeToNudge]
		)

		if (phixer.result.inverted) {
			const invertedIcon = document.querySelector("#inverted")
			invertedIcon.hidden = false
			invertedIcon.ariaHidden = false
		}

		if (phixer.preferences.outputFormat === "none") {
			document.querySelector("#btn-step4").innerHTML = "← Start over"
			document.querySelector("#btn-step4").parentElement.href = ""
		}
	}
}

initStep[1]()

function initNextStep(nextStep, nStepId) {
	switch (nStepId) {
		case 2:
			phixer = new Phixer(inputFiles)
			phixer
				.checkLoaded()
				.then(() => initNextStepLoaded(nextStep, nStepId))
				.catch(() => initNextStepLoaded(errorWindow, 0))
			break
		case 4:
			phixer
				.checkPreferences()
				.then(() => {
					phixer
						.phix()
						.then(() => initNextStepLoaded(resultsWindow, 4))
						.catch(() => initNextStepLoaded(errorWindow, 0))
				})
				.catch(() => initNextStepLoaded(errorWindow, 0))
			break
		default:
			initNextStepLoaded(nextStep, nStepId)
			break
	}
}

function initNextStepLoaded(nextStep, nStepId) {
	nextStep.hidden = false
	footer.hidden = false

	setTimeout(() => {
		spinnerContainer.style.opacity = 0
		nextStep.style.opacity = 1
		footer.style.opacity = 1

		initStep[nStepId]()

		nextStep.ontransitionend = (e) => {
			if (e.propertyName === "opacity") {
				spinnerContainer.classList.add("visually-hidden")
			}
		}
	}, 50)
}

function setup() {
	noCanvas()

	// Hide elements
	errorWindow.hidden = true
	resultsWindow.hidden = true
	document.querySelector("#step-2").hidden = true
	document.querySelector("#step-3").hidden = true
	document.querySelector("#block-2-2-2").hidden = true
	document.querySelector("#block-2-3-2").hidden = true
	document.querySelector("#stop-button").hidden = true
	spinnerContainer.classList.add("visually-hidden")
	spinnerContainer.style.opacity = 0

	// Bootstrap Tooltips component
	const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
	const tooltipList = tooltipTriggerList.map((tooltipTriggerEl) => {
		return new bootstrap.Tooltip(tooltipTriggerEl, {
			boundary: document.body
		})
	})

	const allRNSwitches = document.querySelectorAll(".switch-range-number")
	const allBtnNext = document.querySelectorAll(".button-next")

	// Setting up switches for text / range inputs
	allRNSwitches.forEach((block) => {
		const range = block.querySelector(".switch-range")
		const number = block.querySelector(".switch-number")

		range.querySelector(".text-muted").addEventListener("click", () => {
			range.hidden = true
			number.hidden = false
			number.querySelector("input").dispatchEvent(new Event("change"))
		})

		number.querySelector(".text-muted").addEventListener("click", () => {
			number.hidden = true
			range.hidden = false
			range.querySelector("input").dispatchEvent(new Event("change"))
		})
	})

	// Setting up button functionality
	allBtnNext.forEach((button) => {
		const buttonId = Number(button.id.slice(-1))
		const currentStep = document.querySelector(`#step-${buttonId}`)
		const nextStep = document.querySelector(`#step-${buttonId + 1}`)

		button.addEventListener("click", () => {
			currentStep.style.opacity = 0
			footer.style.opacity = 0
			spinnerContainer.classList.remove("visually-hidden")
			spinnerContainer.style.opacity = 1

			currentStep.ontransitionend = (e) => {
				if (e.propertyName === "opacity") {
					currentStep.hidden = true
					footer.hidden = true

					initButtonStep[buttonId]()

					initNextStep(nextStep, buttonId + 1)
				}
			}
		})
	})
}
