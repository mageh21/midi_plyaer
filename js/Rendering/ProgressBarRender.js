import { getSetting } from "../settings/Settings.js"
import { formatTime } from "../Util.js"
/**
 * Renders the progress bar of the song
 */
export class ProgressBarRender {
	constructor(ctx, renderDimensions) {
		this.ctx = ctx
		this.ctx.canvas.addEventListener(
			"mousemove",
			function (ev) {
				this.mouseX = ev.clientX
			}.bind(this)
		)
		this.ctx.canvas.addEventListener(
			"mouseleave",
			function (ev) {
				this.mouseX = -1000
			}.bind(this)
		)
		this.renderDimensions = renderDimensions
	}
	render(time, end, markers) {
		this.ctx.clearRect(
			0,
			0,
			this.renderDimensions.windowWidth,
			this.renderDimensions.windowHeight
		)
		
		let ctx = this.ctx
		let progressPercent = time / (end / 1000)
		
		// Modern progress bar design - increased height to make room for timer
		const barHeight = 12; // Slightly taller to accommodate timer
		const barY = 4; // Position at top
		const radius = 6; // Rounded corners
		
		// Draw background track - dark with slight transparency
		ctx.fillStyle = "rgba(40, 44, 52, 0.7)";
		this.roundedRect(0, barY, this.renderDimensions.windowWidth, barHeight, radius);
		ctx.fill();
		
		// Create progress gradient
		const progressWidth = this.renderDimensions.windowWidth * progressPercent;
		if (progressWidth > 0) {
			const gradient = ctx.createLinearGradient(0, 0, progressWidth, 0);
			gradient.addColorStop(0, "#61dafb"); // Start with accent blue
			gradient.addColorStop(1, "#8a2be2"); // End with purple
			
			ctx.fillStyle = gradient;
			this.roundedRect(0, barY, progressWidth, barHeight, radius);
			ctx.fill();
		}
		
		// Draw progress indicator circle
		const circleX = this.renderDimensions.windowWidth * progressPercent;
		if (circleX > 0) {
			ctx.beginPath();
			ctx.arc(circleX, barY + barHeight/2, barHeight/1.5, 0, Math.PI * 2);
			ctx.fillStyle = "#ffffff";
			ctx.fill();
			
			// Add subtle shadow/glow effect to the circle
			ctx.shadowColor = "rgba(97, 218, 251, 0.5)";
			ctx.shadowBlur = 6;
			ctx.shadowOffsetX = 0;
			ctx.shadowOffsetY = 0;
		}
		
		let isShowingAMarker = false;

		if (getSetting("showMarkersTimeline")) {
			// Reset shadow for markers
			ctx.shadowBlur = 0;
			
			markers.forEach(marker => {
				let xPos = (marker.timestamp / end) * this.renderDimensions.windowWidth
				if (Math.abs(xPos - this.mouseX) < 10) {
					isShowingAMarker = true
					let txtWd = ctx.measureText(marker.text).width
					ctx.fillStyle = "#ffffff"
					ctx.fillText(
						marker.text,
						Math.max(
							5,
							Math.min(
								this.renderDimensions.windowWidth - txtWd - 5,
								xPos - txtWd / 2
							)
						),
						barY + barHeight + 10
					)
				} else {
					ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
					ctx.lineWidth = 1;
					ctx.beginPath()
					ctx.moveTo(xPos, barY);
					ctx.lineTo(xPos, barY + barHeight);
					ctx.closePath()
					ctx.stroke()
				}
			})
		}

		// Time display - always show
		// Reset shadow
		ctx.shadowBlur = 0;
		
		// Time display styling
		let showMilis = getSetting("showMiliseconds")
		let text = formatTime(Math.min(time, end), showMilis) + " / " + formatTime(end / 1000, showMilis)
		
		// Create modern time display
		ctx.font = "bold 13px 'Source Sans Pro', sans-serif"
		let wd = ctx.measureText(text).width
		
		// Draw timer text directly on progress bar for better visibility
		ctx.fillStyle = "#ffffff";
		ctx.textBaseline = "middle";
		ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
		ctx.shadowBlur = 3;
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
		ctx.fillText(
			text, 
			this.renderDimensions.windowWidth / 2 - wd / 2, 
			barY + barHeight/2
		);
		
		// Reset shadow
		ctx.shadowBlur = 0;
	}
	
	// Helper function for drawing rounded rectangles
	roundedRect(x, y, width, height, radius) {
		const ctx = this.ctx;
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
	}
}
