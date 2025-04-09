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
        // this.context.clear(); // Need a way to clear only notes, not stave
        // this.stave.draw(); // Redraw stave if cleared

        // 2. Get notes relevant to the current view/time
        //    (Requires parsing songData.notes, considering time, etc.)
        
        // 3. Convert MIDI notes to VexFlow format (keys, duration, accidentals)
        //    Example: MIDI note 60 -> "c/4", duration might need calculation
        const notes = [
            // Example notes - replace with actual parsed notes
            this.vf.StaveNote({ clef: "treble", keys: ["c/4"], duration: "q" }),
            this.vf.StaveNote({ clef: "treble", keys: ["d/4"], duration: "q" }),
            this.vf.StaveNote({ clef: "treble", keys: ["e/4"], duration: "q" }),
            this.vf.StaveNote({ clef: "treble", keys: ["f/4"], duration: "h" })
        ];

        // 4. Create voices, format, and draw
        if (notes.length > 0) {
            const voice = this.vf.Voice({ num_beats: 4, beat_value: 4 });
            voice.addTickables(notes);
            
            this.vf.Formatter.FormatAndJustify([voice], this.stave.width - 20);
            
            voice.draw(this.context, this.stave);
            console.log("Drawing example sheet music notes.");
        } else {
            console.log("No notes to draw for sheet music currently.")
        }
        // --- End complex logic section --- 
    }

    resize(width) {
        if(this.vf) {
            this.vf.resize(width, 200); // Adjust height if needed
             // Re-initialize or redraw necessary elements after resize
            this.init(); // Simple re-init for now
        }
    }
} 