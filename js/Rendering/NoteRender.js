import { getSetting, setSettingCallback } from "../settings/Settings.js"
import { drawRoundRect } from "../Util.js"
import { NoteParticleRender } from "./NoteParticleRender.js"
import { PianoParticleRender } from "./PianoParticleRender.js"

/**
 * Class to render the notes on screen.
 */
export class NoteRender {
	constructor(ctx, ctxForeground, renderDimensions, pianoRender) {
		this.ctx = ctx
		this.renderDimensions = renderDimensions
		this.ctxForeground = ctxForeground

		this.pianoRender = pianoRender
		this.lastActiveNotes = {}
		this.noteParticleRender = new NoteParticleRender(
			this.ctxForeground,
			this.renderDimensions
		)
		this.pianoParticleRender = new PianoParticleRender(
			this.pianoRender.playedKeysCtxWhite,
			this.pianoRender.playedKeysCtxBlack,
			this.renderDimensions
		)
	}
	render(time, renderInfoByTrackMap, inputActiveNotes, inputPlayedNotes) {
		this.noteParticleRender.render()

		//sustained note "tails"
		if (getSetting("showSustainedNotes")) {
			this.drawSustainedNotes(renderInfoByTrackMap, time)
		}

		let activeNotesByTrackMap = this.getActiveNotesByTrackMap(
			renderInfoByTrackMap
		)
		//Active notes effect
		Object.keys(activeNotesByTrackMap).forEach(trackIndex => {
			this.renderActiveNotesEffects(activeNotesByTrackMap[trackIndex])
		})

		//Notes
		Object.keys(renderInfoByTrackMap).forEach(trackIndex => {
			this.drawNotes(
				renderInfoByTrackMap[trackIndex].white,
				renderInfoByTrackMap[trackIndex].black
			)
		})
		let currentActiveNotes = {}
		//Active keys on piano + stroking of active notes
		Object.keys(activeNotesByTrackMap).forEach(trackIndex => {
			this.renderActivePianoKeys(
				activeNotesByTrackMap[trackIndex],
				currentActiveNotes
			)

			this.createNoteParticles(activeNotesByTrackMap[trackIndex])
		})
		if (getSetting("drawPianoKeyHitEffect")) {
			this.pianoParticleRender.render()
		}

		this.lastActiveNotes = currentActiveNotes

		this.drawInputNotes(inputActiveNotes, inputPlayedNotes)
	}

	drawSustainedNotes(renderInfoByTrackMap, time) {
		Object.keys(renderInfoByTrackMap).forEach(trackIndex => {
			let notesRenderInfoBlack = renderInfoByTrackMap[trackIndex].black
			let notesRenderInfoWhite = renderInfoByTrackMap[trackIndex].white

			this.ctx.globalAlpha = getSetting("sustainedNotesOpacity") / 100
			this.ctx.strokeStyle = "rgba(0,0,0,1)"
			this.ctx.lineWidth = 1
			if (notesRenderInfoWhite.length > 0) {
				this.ctx.fillStyle = notesRenderInfoWhite[0].fillStyle
			}
			notesRenderInfoWhite.forEach(renderInfo =>
				this.drawSustainedNote(renderInfo)
			)
			if (notesRenderInfoBlack.length > 0) {
				this.ctx.fillStyle = notesRenderInfoBlack[0].fillStyle
			}
			notesRenderInfoBlack.forEach(renderInfo =>
				this.drawSustainedNote(renderInfo)
			)
		})
	}

	drawSustainedNote(renderInfos) {
		let ctx = this.ctx

		let x = renderInfos.x
		let w = renderInfos.w / 2

		if (renderInfos.sustainH && renderInfos.sustainY) {
			ctx.beginPath()
			ctx.rect(x + w / 2, renderInfos.sustainY, w, renderInfos.sustainH)
			ctx.closePath()
			ctx.fill()
		}
	}

	getActiveNotesByTrackMap(renderInfoByTrackMap) {
		return Object.keys(renderInfoByTrackMap).map(trackIndex =>
			this.getActiveNotes(
				renderInfoByTrackMap[trackIndex].black,
				renderInfoByTrackMap[trackIndex].white
			)
		)
	}
	getActiveNotes(notesRenderInfoBlack, notesRenderInfoWhite) {
		let activeNotesBlack = notesRenderInfoBlack
			.slice(0)
			.filter(renderInfo => renderInfo.isOn)

		let activeNotesWhite = notesRenderInfoWhite
			.slice(0)
			.filter(renderInfo => renderInfo.isOn)
		return { white: activeNotesWhite, black: activeNotesBlack }
	}

	renderActiveNotesEffects(activeNotes) {
		if (getSetting("showHitKeys")) {
			if (activeNotes.white.length) {
				this.ctx.fillStyle = activeNotes.white[0].fillStyle
			}
			activeNotes.white.forEach(note => this.renderActiveNoteEffect(note))

			if (activeNotes.black.length) {
				this.ctx.fillStyle = activeNotes.black[0].fillStyle
			}
			activeNotes.black.forEach(note => this.renderActiveNoteEffect(note))
		}
	}

	renderActiveNoteEffect(renderInfos) {
		let ctx = this.ctx
		ctx.globalAlpha = Math.max(
			0,
			0.7 - Math.min(0.7, renderInfos.noteDoneRatio)
		)
		let wOffset = Math.pow(
			this.renderDimensions.whiteKeyWidth / 2,
			1 + Math.min(1, renderInfos.noteDoneRatio) * renderInfos.isOn
		)
		this.doNotePath(renderInfos, {
			x: renderInfos.x - wOffset / 2,
			w: renderInfos.w + wOffset,
			y:
				renderInfos.y -
				(getSetting("reverseNoteDirection")
					? this.renderDimensions.whiteKeyHeight
					: 0),
			h: renderInfos.h + this.renderDimensions.whiteKeyHeight
		})

		ctx.fill()
		ctx.globalAlpha = 1
	}

	drawNotes(notesRenderInfoWhite, notesRenderInfoBlack) {
		let {
			incomingWhiteNotes,
			incomingBlackNotes,
			playedWhiteNotes,
			playedBlackNotes
		} = this.getIncomingAndPlayedNotes(
			notesRenderInfoWhite,
			notesRenderInfoBlack
		)

		this.ctx.globalAlpha = 1
		this.ctx.strokeStyle = getSetting("strokeNotesColor")
		this.ctx.lineWidth = getSetting("strokeNotesWidth")

		this.drawIncomingNotes(incomingWhiteNotes, incomingBlackNotes)

		this.drawPlayedNotes(playedWhiteNotes, playedBlackNotes)
	}

	rectAbovePiano() {
		this.ctx.rect(
			0,
			0,
			this.renderDimensions.windowWidth,
			this.renderDimensions.getAbsolutePianoPosition()
		)
	}
	rectBelowPiano() {
		this.ctx.rect(
			0,
			this.renderDimensions.getAbsolutePianoPosition() +
				this.renderDimensions.whiteKeyHeight,
			this.renderDimensions.windowWidth,
			this.renderDimensions.windowHeight -
				(this.renderDimensions.getAbsolutePianoPosition() +
					this.renderDimensions.whiteKeyHeight)
		)
	}
	drawPlayedNotes(playedWhiteNotes, playedBlackNotes) {
		this.ctx.save()
		this.ctx.beginPath()
		getSetting("reverseNoteDirection")
			? this.rectAbovePiano()
			: this.rectBelowPiano()

		this.ctx.clip()
		this.ctx.closePath()
		this.ctx.fillStyle = playedWhiteNotes.length
			? playedWhiteNotes[0].fillStyle
			: ""

		playedWhiteNotes.forEach(renderInfo => {
			this.drawNoteAfter(renderInfo)
			this.ctx.fill()
			this.strokeActiveAndOthers(renderInfo)
		})

		this.ctx.fillStyle = playedBlackNotes.length
			? playedBlackNotes[0].fillStyle
			: ""
		playedBlackNotes.forEach(renderInfo => {
			this.drawNoteAfter(renderInfo)
			this.ctx.fill()
			this.strokeActiveAndOthers(renderInfo)
		})

		this.ctx.restore()
	}

	strokeActiveAndOthers(renderInfo) {
		if (renderInfo.isOn) {
			this.ctx.strokeStyle = getSetting("strokeActiveNotesColor")
			this.ctx.lineWidth = getSetting("strokeActiveNotesWidth")
			this.ctx.stroke()
		} else if (getSetting("strokeNotes")) {
			this.ctx.strokeStyle = getSetting("strokeNotesColor")
			this.ctx.lineWidth = getSetting("strokeNotesWidth")
			this.ctx.stroke()
		}
	}

	drawIncomingNotes(incomingWhiteNotes, incomingBlackNotes) {
		this.ctx.save()
		this.ctx.beginPath()
		getSetting("reverseNoteDirection")
			? this.rectBelowPiano()
			: this.rectAbovePiano()
		this.ctx.clip()
		this.ctx.closePath()
		this.ctx.fillStyle = incomingWhiteNotes.length
			? incomingWhiteNotes[0].fillStyle
			: ""
		incomingWhiteNotes.forEach(renderInfo => {
			this.drawNoteBefore(renderInfo)
			this.ctx.fill()
			this.strokeActiveAndOthers(renderInfo)
		})

		this.ctx.fillStyle = incomingBlackNotes.length
			? incomingBlackNotes[0].fillStyle
			: ""
		incomingBlackNotes.forEach(renderInfo => {
			this.drawNoteBefore(renderInfo)
			this.ctx.fill()
			this.strokeActiveAndOthers(renderInfo)
		})
		this.ctx.restore()
	}

	getIncomingAndPlayedNotes(notesRenderInfoWhite, notesRenderInfoBlack) {
		let incomingWhiteNotes = []
		let playedWhiteNotes = []
		notesRenderInfoWhite
			.filter(renderInfo => renderInfo.w > 0 && renderInfo.h > 0)
			.forEach(renderInfo => {
				if (renderInfo.noteDoneRatio < 1) {
					incomingWhiteNotes.push(renderInfo)
				}
				if (getSetting("pianoPosition") != 0 && renderInfo.noteDoneRatio > 0) {
					playedWhiteNotes.push(renderInfo)
				}
			})
		let incomingBlackNotes = []
		let playedBlackNotes = []
		notesRenderInfoBlack
			.filter(renderInfo => renderInfo.w > 0 && renderInfo.h > 0)
			.forEach(renderInfo => {
				if (renderInfo.noteDoneRatio < 1) {
					incomingBlackNotes.push(renderInfo)
				}
				if (getSetting("pianoPosition") != 0 && renderInfo.noteDoneRatio > 0) {
					playedBlackNotes.push(renderInfo)
				}
			})
		return {
			incomingWhiteNotes,
			incomingBlackNotes,
			playedWhiteNotes,
			playedBlackNotes
		}
	}

	drawInputNotes(inputActiveNotes, inputPlayedNotes) {
		this.ctx.globalAlpha = 1
		this.ctx.strokeStyle = getSetting("strokeNotesColor")
		this.ctx.lineWidth = getSetting("strokeNotesWidth")
		this.ctx.fillStyle = getSetting("inputNoteColor")
		let whiteActive = inputActiveNotes.filter(noteInfo => !noteInfo.isBlack)
		inputActiveNotes.forEach(noteInfo => {
			this.createNoteParticle(noteInfo)
			this.pianoRender.drawActiveInputKey(
				parseInt(noteInfo.noteNumber),
				this.ctx.fillStyle
			)
			this.drawNoteAfter(noteInfo)
			this.ctx.fill()
		})
		inputPlayedNotes.forEach(noteInfo => {
			// noteInfo.y += this.renderDimensions.whiteKeyHeight
			this.drawNoteAfter(noteInfo)
			this.ctx.fill()
		})
	}
	drawNote(renderInfos) {
		// Apply gradient fill based on note velocity
		const intensity = renderInfos.velocity / 127; // Normalize velocity to 0-1
		const ctx = this.ctx;
		
		// Save context for gradient
		ctx.save();
		
		// Create gradient based on note color and velocity
		const gradient = ctx.createLinearGradient(
			renderInfos.x, 
			renderInfos.y, 
			renderInfos.x + renderInfos.w, 
			renderInfos.y + renderInfos.h
		);
		
		// Parse the current fill style to create the gradient
		let baseColor = renderInfos.fillStyle;
		
		// Add stops to gradient
		gradient.addColorStop(0, baseColor);
		
		// Create a lighter version of the color for the gradient
		let lighterColor;
		if (baseColor.startsWith('rgba')) {
			// Extract RGBA values
			const rgba = baseColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([.\d]+)\)/);
			if (rgba) {
				const r = Math.min(255, parseInt(rgba[1]) + 40);
				const g = Math.min(255, parseInt(rgba[2]) + 40);
				const b = Math.min(255, parseInt(rgba[3]) + 40);
				lighterColor = `rgba(${r}, ${g}, ${b}, ${rgba[4]})`;
			} else {
				lighterColor = baseColor;
			}
		} else {
			lighterColor = baseColor;
		}
		
		gradient.addColorStop(1, lighterColor);
		
		// Apply gradient
		ctx.fillStyle = gradient;
		
		// Draw the note with special effects
		this.doNotePath(renderInfos);
		ctx.fill();
		
		// Add highlight effect at the top of the note (for dimension)
		if (renderInfos.h > 20) { // Only for notes tall enough
			ctx.beginPath();
			ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
			
			// Draw rounded rectangle for highlight
			const x = renderInfos.x + 2;
			const y = renderInfos.y + 2;
			const width = renderInfos.w - 4;
			const height = Math.min(5, renderInfos.h * 0.2);
			const radius = Math.min(renderInfos.rad - 1, 3);
			
			// Manual rounded rect path
			ctx.beginPath();
			ctx.moveTo(x + radius, y);
			ctx.lineTo(x + width - radius, y);
			ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
			ctx.lineTo(x + width, y + height - radius);
			ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
			ctx.lineTo(x + radius, y + height);
			ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
			ctx.lineTo(x, y + radius);
			ctx.quadraticCurveTo(x, y, x + radius, y);
			ctx.closePath();
			
			ctx.fill();
		}
		
		// Apply stroke
		this.strokeActiveAndOthers(renderInfos);
		
		// Restore context after gradient
		ctx.restore();
		
		// --- Add Note Name Text --- 
		if (getSetting("showFallingNoteNames")) { // Optional: Add a setting later
			const noteName = this.getDisplayNoteName(renderInfos.noteNumber);
			if (noteName) {
				const fontSize = Math.min(renderInfos.w * 0.6, 12); // Adjust size based on width
				this.ctx.font = `${fontSize}px Arial`;
				this.ctx.textAlign = "center";
				this.ctx.textBaseline = "top";

				// Choose contrasting text color (simple example)
				const avgColorVal = this.getAverageColorValue(renderInfos.fillStyle);
				this.ctx.fillStyle = avgColorVal > 128 ? "#000000" : "#FFFFFF"; 
				
				// Calculate position (near top-center of the note rectangle)
				const textX = renderInfos.x + renderInfos.w / 2;
				const textY = renderInfos.y + fontSize * 0.5; // Add small top margin
				
				// Only draw if note is tall enough
				if (renderInfos.h > fontSize * 1.5) { 
					this.ctx.fillText(noteName, textX, textY);
				}
			}
		}
		// --- End Note Name Text ---
	}

	drawNoteAfter(renderInfos) {
		let y =
			renderInfos.y +
			(getSetting("reverseNoteDirection") ? -1 : 1) *
				this.renderDimensions.whiteKeyHeight

		this.doNotePath(renderInfos, {
			y
		})
	}

	drawNoteBefore(renderInfos) {
		//Done by .clip() now. Keep in case clipping isn't performant
		// let h = Math.min(
		// 	renderInfos.h,
		// 	this.renderDimensions.getAbsolutePianoPosition() - renderInfos.y
		// )
		this.doNotePath(renderInfos /*, { h }*/)
	}

	renderActivePianoKeys(activeNotes, currentActiveNotes) {
		if (getSetting("highlightActivePianoKeys")) {
			activeNotes.white.forEach(noteRenderInfo => {
				this.pianoRender.drawActiveKey(noteRenderInfo, noteRenderInfo.fillStyle)
			})
			activeNotes.black.forEach(noteRenderInfo => {
				this.pianoRender.drawActiveKey(noteRenderInfo, noteRenderInfo.fillStyle)
			})

			//stroke newly hit ones
			//TODO: Doesn't look very nice.
			if (getSetting("drawPianoKeyHitEffect")) {
				activeNotes.white.forEach(noteRenderInfo => {
					currentActiveNotes[noteRenderInfo.noteId] = true
					if (!this.lastActiveNotes.hasOwnProperty(noteRenderInfo.noteId)) {
						this.pianoParticleRender.add(noteRenderInfo)
					}
				})
				activeNotes.black.forEach(noteRenderInfo => {
					currentActiveNotes[noteRenderInfo.noteId] = true
					if (!this.lastActiveNotes.hasOwnProperty(noteRenderInfo.noteId)) {
						this.pianoParticleRender.add(noteRenderInfo)
					}
				})
			}
		}
	}

	strokeNote(renderInfo) {
		this.drawNoteBefore(renderInfo)
		this.ctx.stroke()

		if (renderInfo.isOn) {
			this.drawNoteAfter(renderInfo)
			this.ctx.stroke()
		}
	}

	doNotePath(renderInfo, overWriteParams) {
		if (!overWriteParams) {
			overWriteParams = {}
		}
		for (let key in renderInfo) {
			if (!overWriteParams.hasOwnProperty(key)) {
				overWriteParams[key] = renderInfo[key]
			}
		}
		
		// Always use rounded corners for modern look
		const radius = Math.max(overWriteParams.rad, getSetting("noteBorderRadius") || 10);
		
		// Add glow and shadow effects
		this.ctx.shadowColor = renderInfo.fillStyle;
		this.ctx.shadowBlur = 8;
		this.ctx.shadowOffsetX = 0;
		this.ctx.shadowOffsetY = 0;
		
		// Draw note with rounded corners
		drawRoundRect(
			this.ctx,
			overWriteParams.x,
			overWriteParams.y,
			overWriteParams.w,
			overWriteParams.h,
			radius,
			true
		);
		
		// Reset shadow to avoid affecting other elements
		this.ctx.shadowBlur = 0;
	}

	createNoteParticles(activeNotes, colWhite, colBlack) {
		if (getSetting("showParticlesTop") || getSetting("showParticlesBottom")) {
			activeNotes.white.forEach(noteRenderInfo =>
				this.createNoteParticle(noteRenderInfo)
			)
			activeNotes.black.forEach(noteRenderInfo =>
				this.createNoteParticle(noteRenderInfo)
			)
		}
	}
	createNoteParticle(noteRenderInfo) {
		this.noteParticleRender.createParticles(
			noteRenderInfo.x,
			this.renderDimensions.getAbsolutePianoPosition(),
			noteRenderInfo.w,
			this.renderDimensions.whiteKeyHeight,
			noteRenderInfo.fillStyle,
			noteRenderInfo.velocity
		)
	}

	getAlphaFromY(y) {
		//TODO broken.
		return Math.min(
			1,
			Math.max(
				0,
				(y - this.menuHeight - 5) /
					((this.renderDimensions.windowHeight - this.menuHeight) * 0.5)
			)
		)
	}
	/**
	 * Sets Menu (Navbar) Height.  Required to calculate fadeIn alpha value
	 *
	 * @param {Number} menuHeight
	 */
	setMenuHeight(menuHeight) {
		this.menuHeight = menuHeight
	}

	// --- Helper function to get note name ---
	getDisplayNoteName(noteNumber) {
		const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
		if (noteNumber !== undefined) {
			const octave = Math.floor(noteNumber / 12) - 1;
			const note = noteNumber % 12;
			return noteNames[note] + octave;
		}
		return '';
	}

	// --- Helper function to determine contrast color ---
	getAverageColorValue(color) {
		if (!color) return 128;
		
		// Handle rgba format
		if (color.startsWith('rgba')) {
			const rgba = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([.\d]+)\)/);
			if (rgba) {
				return (parseInt(rgba[1]) + parseInt(rgba[2]) + parseInt(rgba[3])) / 3;
			}
		}
		
		// Handle rgb format
		if (color.startsWith('rgb')) {
			const rgb = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
			if (rgb) {
				return (parseInt(rgb[1]) + parseInt(rgb[2]) + parseInt(rgb[3])) / 3;
			}
		}
		
		// Default value
		return 128;
	}
}
