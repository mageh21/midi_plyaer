import { Factory } from 'vexflow';

export class SheetMusicRender {
    constructor(containerId) {
        this.containerId = containerId;
        this.vf = null;
        this.context = null;
        this.stave = null;
    }

    init() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Sheet music container #${this.containerId} not found.`);
            return;
        }
        // Clear previous content if any
        container.innerHTML = '';

        // Create VexFlow Factory
        this.vf = new Factory({
            renderer: { 
                elementId: this.containerId, 
                width: container.offsetWidth, 
                height: 200 // Initial height, adjust as needed
            }
        });
        this.context = this.vf.getContext();

        // Basic stave setup (example)
        this.stave = this.vf.Stave(10, 40, container.offsetWidth - 20); // x, y, width
        this.stave.addClef("treble").addTimeSignature("4/4");
        this.stave.setContext(this.context).draw();

        console.log("VexFlow initialized for sheet music.");
    }

    render(songData) {
        if (!this.vf || !songData) {
            // console.warn("SheetMusicRender not initialized or no song data.");
            return; 
        }

        // --- This is where the complex logic goes --- 
        // 1. Clear previous notes
        this.context.clear(); // Clear the canvas
        this.stave.draw(); // Redraw the stave 

        // 2. Get notes relevant to the current view/time
        //    (Requires parsing songData.notes, considering time, etc.)
        
        // 3. Convert MIDI notes to VexFlow format (keys, duration, accidentals)
        //    Example: MIDI note 60 -> "c/4", duration might need calculation
        
        // --- REMOVED EXAMPLE NOTE DRAWING LOGIC ---
        // const notes = [ ... ]; 
        // if (notes.length > 0) { ... }
        // --- END REMOVED LOGIC ---

        console.log("Sheet music render called (no notes drawn yet).");
        
        // --- End complex logic section --- 
    }

    resize(width) {
        if(this.vf) {
            console.log("Resizing sheet music container.");
            // Re-initialize to handle resize correctly for now
            this.init(); 
        }
    }
} 