(function() {
    'use strict';

    // ========================================
    // CONFIGURATION
    // ========================================

    const CONFIG = {
        // Layout
        baseSize: 600,              // Reference size for scaling
        scaleRatio: 0.17,           // Scale as fraction of canvas size (smaller to leave room for sine waves)
        axisMargin: 50,             // Margin from edge to axis endpoints
        tickLength: 5,              // Half-length of tick marks
        pointRadius: 6,             // Current point radius
        arcStep: 0.02,              // Arc drawing resolution

        // Tick label offsets (at base size)
        tickOffsets: {
            xPosLeft: 15,
            xNegLeft: 30,
            xTop: 18,
            yLeft: 10,
            yPosTop: 28,
            yNegTop: 8
        },

        // Projection label offsets (at base size)
        projectionOffsets: {
            labelAbove: 8,
            labelBelow: 15,
            labelSide: 18
        },

        // Font sizes (at base size, in rem)
        fonts: {
            tick: 1.35,
            axisLabel: 1.65,
            projection: 12          // in pixels
        },

        // Timing (all durations in milliseconds)
        timing: {
            cycleDuration: 5180,          // ms for one full sweep
            startPauseDuration: 500,      // ms pause before sweep starts
            completionPauseDuration: 500, // ms pause after sweep completes
            earlyTriggerOffset: 0.005,
            finalNoteProgress: 0.97,
            popDuration: 500,             // ms for pop animation
            sineWaveFadeDuration: 1000    // ms for sine wave fade out
        },

        // Audio
        audio: {
            scheduleAheadTime: 0.1,
            reverbDuration: 6,
            reverbDecay: 1.5,
            wetDryMix: { dry: 0.3, wet: 0.7 },
            masterGain: 0.25,
            bellDuration: 1.5,
            harmonics: [
                { freq: 1.0, gain: 0.5 },
                { freq: 2.76, gain: 0.3 },
                { freq: 5.4, gain: 0.15 },
                { freq: 8.93, gain: 0.08 }
            ],
            pad: {
                octavesDown: 2,
                gain: 0.08,
                swellTime: 1.2,
                fadeTime: 4.0,
                detune: [0, -4, 0, 3],
                layerDetune: 2
            }
        },

        // Visual
        visual: {
            popStartSize: 5,
            popEndSize: 30,
            circleLineWidth: 3,
            sweepLineAlpha: 0.3,
            ghostCircleAlpha: 0.1,
            radiusLineAlpha: 0.6,
            projectionAlpha: 0.4,
            projectionLabelAlpha: 0.6,
            axisColor: '#d1d5db',
            backgroundColor: '#ffffff'
        },

        // Colors
        colors: {
            buttonActive: '#059669',
            buttonInactive: '#2563eb'
        },

        // Square and sine wave emanation
        square: {
            color: '#d1d5db',
            lineWidth: 1
        },
        sineWave: {
            maxSpread: 190,           // Maximum distance from edge (pixels at base size) - full wave visible
            color: '#9ca3af',
            lineWidth: 1.5
        },

        // Music theory
        music: {
            c6Frequency: 1046.50,
            semitoneRatio: Math.pow(2, 1/12),
            arpeggioIntervals: [0, 4, 7, 12],
            notes: ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'],
            noteToSemitone: { 'C': 0, 'C#': 1, 'D': 2, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'Ab': 8, 'A': 9, 'Bb': 10, 'B': 11 }
        }
    };

    // ========================================
    // FUNCTION CYCLES
    // ========================================

    // Precomputed t-values where functions equal -1, 0, or 1 (within sweep range -π to π)
    // xCrossings: t values where xFunc(t) = -1, 0, 1 (for top/bottom edge points)
    // yCrossings: t values where yFunc(t) = -1, 0, 1 (for left/right edge points)
    const FUNCTION_CYCLES = [
        { name: "$\\left[\\sin x,\\ \\frac{d}{dx}(\\sin x)\\right]$", xLabel: "$\\sin x$", yLabel: "$\\frac{d}{dx}(\\sin x)$", xFunc: Math.sin, yFunc: Math.cos, color: '#dc2626', ascending: true,
          xCrossings: [-Math.PI/2, 0, Math.PI/2], yCrossings: [-Math.PI, -Math.PI/2, 0, Math.PI/2, Math.PI] },
        { name: "$\\left[\\sin x,\\ \\int \\sin x\\, dx\\right]$", xLabel: "$\\sin x$", yLabel: "$\\int \\sin x\\, dx$", xFunc: Math.sin, yFunc: t => -Math.cos(t), color: '#ea580c', ascending: false,
          xCrossings: [-Math.PI/2, 0, Math.PI/2], yCrossings: [-Math.PI, -Math.PI/2, 0, Math.PI/2, Math.PI] },
        { name: "$\\left[\\cos x,\\ \\frac{d}{dx}(\\cos x)\\right]$", xLabel: "$\\cos x$", yLabel: "$\\frac{d}{dx}(\\cos x)$", xFunc: Math.cos, yFunc: t => -Math.sin(t), color: '#ca8a04', ascending: true,
          xCrossings: [-Math.PI, -Math.PI/2, 0, Math.PI/2, Math.PI], yCrossings: [-Math.PI/2, 0, Math.PI/2] },
        { name: "$\\left[\\cos x,\\ \\int \\cos x\\, dx\\right]$", xLabel: "$\\cos x$", yLabel: "$\\int \\cos x\\, dx$", xFunc: Math.cos, yFunc: Math.sin, color: '#059669', ascending: false,
          xCrossings: [-Math.PI, -Math.PI/2, 0, Math.PI/2, Math.PI], yCrossings: [-Math.PI/2, 0, Math.PI/2] },
        { name: "$\\left[-\\sin x,\\ \\frac{d}{dx}(-\\sin x)\\right]$", xLabel: "$-\\sin x$", yLabel: "$\\frac{d}{dx}(-\\sin x)$", xFunc: t => -Math.sin(t), yFunc: t => -Math.cos(t), color: '#2563eb', ascending: true,
          xCrossings: [-Math.PI/2, 0, Math.PI/2], yCrossings: [-Math.PI, -Math.PI/2, 0, Math.PI/2, Math.PI] },
        { name: "$\\left[-\\sin x,\\ \\int -\\sin x\\, dx\\right]$", xLabel: "$-\\sin x$", yLabel: "$\\int -\\sin x\\, dx$", xFunc: t => -Math.sin(t), yFunc: Math.cos, color: '#4f46e5', ascending: false,
          xCrossings: [-Math.PI/2, 0, Math.PI/2], yCrossings: [-Math.PI, -Math.PI/2, 0, Math.PI/2, Math.PI] },
        { name: "$\\left[-\\cos x,\\ \\frac{d}{dx}(-\\cos x)\\right]$", xLabel: "$-\\cos x$", yLabel: "$\\frac{d}{dx}(-\\cos x)$", xFunc: t => -Math.cos(t), yFunc: Math.sin, color: '#7c3aed', ascending: true,
          xCrossings: [-Math.PI, -Math.PI/2, 0, Math.PI/2, Math.PI], yCrossings: [-Math.PI/2, 0, Math.PI/2] },
        { name: "$\\left[-\\cos x,\\ \\int -\\cos x\\, dx\\right]$", xLabel: "$-\\cos x$", yLabel: "$\\int -\\cos x\\, dx$", xFunc: t => -Math.cos(t), yFunc: t => -Math.sin(t), color: '#000000', ascending: false,
          xCrossings: [-Math.PI, -Math.PI/2, 0, Math.PI/2, Math.PI], yCrossings: [-Math.PI/2, 0, Math.PI/2] }
    ];

    // ========================================
    // CACHED DOM ELEMENTS
    // ========================================

    const elements = {
        canvas: document.getElementById('parametricCircle'),
        container: document.getElementById('canvasContainer'),
        functionLabel: document.getElementById('functionLabel'),
        rangeLabel: document.getElementById('rangeLabel'),
        xAxisLabel: document.getElementById('xAxisLabel'),
        yAxisLabel: document.getElementById('yAxisLabel'),
        tickXPos: document.getElementById('tickXPos'),
        tickXNeg: document.getElementById('tickXNeg'),
        tickYPos: document.getElementById('tickYPos'),
        tickYNeg: document.getElementById('tickYNeg'),
        audioButton: document.getElementById('audioButton'),
        audioIcon: document.getElementById('audioIcon')
    };

    const ctx = elements.canvas.getContext('2d');

    // ========================================
    // DIMENSIONS (Single source of truth)
    // ========================================

    const dimensions = {
        canvasSize: CONFIG.baseSize,
        scale: CONFIG.baseSize * CONFIG.scaleRatio,
        center: CONFIG.baseSize / 2,
        dpr: window.devicePixelRatio || 1,

        update() {
            this.canvasSize = elements.container.clientWidth;
            this.scale = this.canvasSize * CONFIG.scaleRatio;
            this.center = this.canvasSize / 2;
            this.dpr = window.devicePixelRatio || 1;

            // Update canvas
            elements.canvas.width = this.canvasSize * this.dpr;
            elements.canvas.height = this.canvasSize * this.dpr;
            elements.canvas.style.width = this.canvasSize + 'px';
            elements.canvas.style.height = this.canvasSize + 'px';
            ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        },

        getScaleFactor() {
            return this.canvasSize / CONFIG.baseSize;
        },

        // For text elements that need to stay readable on mobile
        getTextScaleFactor() {
            const factor = this.canvasSize / CONFIG.baseSize;
            // On small screens, don't let text shrink below 70% of base size
            return Math.max(factor, 0.7);
        }
    };

    // ========================================
    // STATE (Pure data, mutated only by controller)
    // ========================================

    const state = {
        sweepProgress: 0,
        parameterT: -Math.PI,
        cycleIndex: 0,
        phase: 'startPause',        // 'startPause' | 'sweep' | 'completionPause'
        phaseStartTime: performance.now(),
        fifthsIndex: 0,
        noteIndex: 0,
        lastProgressQuarter: -1,
        finalNotePlayed: false,
        padStarted: false,
        pops: [],                   // Array of {x, y, createdAt, color}
        lastLabelCycleIndex: -1,
        // Sine wave emanation state
        sineWaveHistory: [],        // Array of {xVal, yVal, progress} points for current cycle
        fadingSineWaves: []         // Array of {points: [], color: '', createdAt, edges: [], cycleIndex}
    };

    // ========================================
    // EDGE PATTERN FOR SINE WAVES
    // ========================================

    const EDGE_PATTERNS = [
        ['left', 'top'],      // Cycle 0
        ['left', 'bottom'],   // Cycle 1
        ['right', 'top'],     // Cycle 2
        ['right', 'bottom'],  // Cycle 3
        ['right', 'bottom'],  // Cycle 4 (reverse starts)
        ['right', 'top'],     // Cycle 5
        ['left', 'bottom'],   // Cycle 6
        ['left', 'top']       // Cycle 7
    ];

    function getActiveEdges(cycleIndex) {
        return EDGE_PATTERNS[cycleIndex % 8];
    }

    // ========================================
    // MUSIC THEORY (Pure functions)
    // ========================================

    const musicTheory = {
        circleOfFifths: (function() {
            const circle = [];
            let index = 0;
            for (let i = 0; i < 12; i++) {
                circle.push(CONFIG.music.notes[index]);
                index = (index + 7) % 12;
            }
            return circle;
        })(),

        keyFrequencies: null,

        init() {
            this.keyFrequencies = {};
            this.circleOfFifths.forEach(key => {
                const rootSemitone = CONFIG.music.noteToSemitone[key];
                const rootFreq = CONFIG.music.c6Frequency * Math.pow(CONFIG.music.semitoneRatio, rootSemitone);
                this.keyFrequencies[key] = CONFIG.music.arpeggioIntervals.map(interval =>
                    rootFreq * Math.pow(CONFIG.music.semitoneRatio, interval)
                );
            });
        },

        getCurrentKey(fifthsIndex) {
            return this.circleOfFifths[fifthsIndex % 12];
        },

        getArpeggioFrequency(key, noteIndex, ascending) {
            const index = ascending ? noteIndex : (3 - noteIndex);
            return this.keyFrequencies[key][index];
        },

        getAxisCrossingT(noteIndex) {
            const targetProgress = (noteIndex + 1) * 0.25;
            return -Math.PI + targetProgress * 2 * Math.PI;
        }
    };

    // Initialize music theory
    musicTheory.init();

    // ========================================
    // AUDIO MODULE
    // ========================================

    const audio = {
        context: null,
        enabled: false,
        masterGain: null,
        convolver: null,
        dryGain: null,
        wetGain: null,
        padOscillators: [],
        padGains: [],

        init() {
            this.context = new (window.AudioContext || window.webkitAudioContext)();

            this.masterGain = this.context.createGain();
            this.masterGain.gain.value = CONFIG.audio.masterGain;

            this.convolver = this.createReverb();

            this.dryGain = this.context.createGain();
            this.wetGain = this.context.createGain();
            this.dryGain.gain.value = CONFIG.audio.wetDryMix.dry;
            this.wetGain.gain.value = CONFIG.audio.wetDryMix.wet;

            this.masterGain.connect(this.dryGain);
            this.masterGain.connect(this.convolver);
            this.convolver.connect(this.wetGain);
            this.dryGain.connect(this.context.destination);
            this.wetGain.connect(this.context.destination);
        },

        createReverb() {
            const convolver = this.context.createConvolver();
            const duration = CONFIG.audio.reverbDuration;
            const sampleRate = this.context.sampleRate;
            const length = sampleRate * duration;
            const buffer = this.context.createBuffer(2, length, sampleRate);

            for (let channel = 0; channel < 2; channel++) {
                const data = buffer.getChannelData(channel);
                for (let i = 0; i < length; i++) {
                    const decay = Math.pow(1 - i / length, CONFIG.audio.reverbDecay);
                    data[i] = (Math.random() * 2 - 1) * decay;
                }
            }

            convolver.buffer = buffer;
            return convolver;
        },

        playBell(frequency) {
            if (!this.enabled || !this.context) return;

            const now = this.context.currentTime;
            const start = now + CONFIG.audio.scheduleAheadTime;
            const duration = CONFIG.audio.bellDuration;

            CONFIG.audio.harmonics.forEach(harmonic => {
                const osc = this.context.createOscillator();
                const gain = this.context.createGain();

                osc.frequency.value = frequency * harmonic.freq;
                osc.type = 'sine';
                gain.gain.setValueAtTime(harmonic.gain, start);
                gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

                osc.connect(gain);
                gain.connect(this.masterGain);
                osc.start(start);
                osc.stop(start + duration);
            });
        },

        startPad(rootFrequency) {
            if (!this.enabled || !this.context) return;

            const now = this.context.currentTime;
            const start = now + CONFIG.audio.scheduleAheadTime;
            const pad = CONFIG.audio.pad;

            const octaveMultiplier = Math.pow(0.5, pad.octavesDown);
            const baseFreq = rootFrequency * octaveMultiplier;
            const chordFreqs = [
                { freq: baseFreq / 4, gainMult: 10.0 },
                { freq: baseFreq, gainMult: 1.0 },
                { freq: baseFreq * Math.pow(2, 4/12), gainMult: 1.0 },
                { freq: baseFreq * Math.pow(2, 7/12), gainMult: 1.0 }
            ];

            chordFreqs.forEach((note, i) => {
                for (let layer = 0; layer < 2; layer++) {
                    const osc = this.context.createOscillator();
                    const gain = this.context.createGain();

                    osc.type = 'sine';
                    osc.frequency.value = note.freq;
                    osc.detune.value = (pad.detune[i % pad.detune.length] || 0) + (layer === 0 ? -pad.layerDetune : pad.layerDetune);

                    gain.gain.setValueAtTime(0.001, start);
                    gain.gain.exponentialRampToValueAtTime((pad.gain / 2) * note.gainMult, start + pad.swellTime);

                    osc.connect(gain);
                    gain.connect(this.masterGain);
                    osc.start(start);

                    this.padOscillators.push(osc);
                    this.padGains.push(gain);
                }
            });
        },

        stopPad() {
            if (!this.context || this.padOscillators.length === 0) return;

            const now = this.context.currentTime;
            const fadeTime = CONFIG.audio.pad.fadeTime;

            const fadingOscs = this.padOscillators;
            const fadingGains = this.padGains;
            this.padOscillators = [];
            this.padGains = [];

            fadingGains.forEach(gain => {
                try {
                    gain.gain.cancelScheduledValues(now);
                    gain.gain.setValueAtTime(gain.gain.value, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + fadeTime);
                } catch (e) { /* ignore */ }
            });

            fadingOscs.forEach(osc => {
                try {
                    osc.stop(now + fadeTime + 0.1);
                } catch (e) { /* ignore */ }
            });
        },

        killAll() {
            if (!this.context) return;

            // Immediately stop all pad oscillators
            this.padOscillators.forEach(osc => {
                try { osc.stop(0); } catch (e) { /* ignore */ }
            });
            this.padOscillators = [];
            this.padGains = [];

            // Close and recreate context to kill any in-flight bell tones
            this.context.close();
            this.context = null;
        },

        toggle() {
            if (!this.enabled) {
                if (!this.context) this.init();
                this.enabled = true;
                // Sync music state to current progress so bells play at correct times
                this.syncToCurrentProgress();
            } else {
                this.enabled = false;
                this.killAll();
            }
            return this.enabled;
        },

        syncToCurrentProgress() {
            // Calculate current progress from elapsed time
            let currentProgress = 0;
            if (state.phase === 'sweep') {
                const elapsed = performance.now() - state.phaseStartTime;
                currentProgress = Math.min(elapsed / CONFIG.timing.cycleDuration, 1);
            } else if (state.phase === 'completionPause') {
                currentProgress = 1;
            }

            // Calculate which quarter we're in based on current sweep progress
            const adjustedProgress = currentProgress + CONFIG.timing.earlyTriggerOffset;
            const currentQuarter = Math.floor(adjustedProgress * 4);

            // Set lastProgressQuarter so we don't replay notes that should have already played
            state.lastProgressQuarter = currentQuarter;

            // Calculate how many notes should have played (quarters 1, 2, 3 = notes 0, 1, 2)
            state.noteIndex = Math.max(0, Math.min(currentQuarter, 3));

            // Check if final note should have played
            state.finalNotePlayed = currentProgress >= CONFIG.timing.finalNoteProgress;

            // Start pad if we're in an ascending cycle and haven't completed it
            const cycle = FUNCTION_CYCLES[state.cycleIndex];
            if (cycle.ascending && currentProgress < 1 && state.phase === 'sweep') {
                const key = musicTheory.getCurrentKey(state.fifthsIndex);
                this.startPad(musicTheory.keyFrequencies[key][0]);
                state.padStarted = true;
            } else {
                state.padStarted = cycle.ascending; // Mark as already started/done if ascending
            }
        }
    };

    // ========================================
    // RENDERER (Pure - no state mutation)
    // ========================================

    const renderer = {
        clear() {
            ctx.fillStyle = CONFIG.visual.backgroundColor;
            ctx.fillRect(0, 0, dimensions.canvasSize, dimensions.canvasSize);
        },

        drawSquare() {
            const { center, scale } = dimensions;
            ctx.strokeStyle = CONFIG.square.color;
            ctx.lineWidth = CONFIG.square.lineWidth;

            ctx.beginPath();
            ctx.rect(center - scale, center - scale, scale * 2, scale * 2);
            ctx.stroke();
        },

        drawEdgeProjections(x, y, edges) {
            const { center, scale } = dimensions;
            ctx.strokeStyle = CONFIG.square.color;
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);

            edges.forEach(edge => {
                ctx.beginPath();
                if (edge === 'top') {
                    ctx.moveTo(x, y);
                    ctx.lineTo(x, center - scale);
                } else if (edge === 'bottom') {
                    ctx.moveTo(x, y);
                    ctx.lineTo(x, center + scale);
                } else if (edge === 'left') {
                    ctx.moveTo(x, y);
                    ctx.lineTo(center - scale, y);
                } else if (edge === 'right') {
                    ctx.moveTo(x, y);
                    ctx.lineTo(center + scale, y);
                }
                ctx.stroke();
            });

            ctx.setLineDash([]);
        },

        drawSineWaves(history, edges, cycleIndex, currentProgress, fadeAlpha) {
            if (history.length < 2) return;
            if (fadeAlpha === undefined) fadeAlpha = 1;

            const { center, scale } = dimensions;
            const scaleFactor = dimensions.getScaleFactor();
            const maxSpread = CONFIG.sineWave.maxSpread * scaleFactor;
            const cycle = FUNCTION_CYCLES[cycleIndex];

            ctx.strokeStyle = cycle.color;
            ctx.lineWidth = CONFIG.visual.circleLineWidth;
            // Match the circle's alpha, multiplied by fade alpha for fading waves
            ctx.globalAlpha = CONFIG.visual.sweepLineAlpha * fadeAlpha;

            edges.forEach(edge => {
                ctx.beginPath();
                let first = true;

                history.forEach((point, i) => {
                    // Convert logical coordinates to screen coordinates
                    const screenX = center + point.xVal * scale;
                    const screenY = center - point.yVal * scale;

                    // Spread based on progress difference, not frame count
                    const progressDiff = currentProgress - point.progress;
                    const spread = Math.min(progressDiff * maxSpread, maxSpread);

                    let drawX, drawY;
                    if (edge === 'top') {
                        drawX = screenX;
                        drawY = (center - scale) - spread;
                    } else if (edge === 'bottom') {
                        drawX = screenX;
                        drawY = (center + scale) + spread;
                    } else if (edge === 'left') {
                        drawX = (center - scale) - spread;
                        drawY = screenY;
                    } else if (edge === 'right') {
                        drawX = (center + scale) + spread;
                        drawY = screenY;
                    }

                    if (first) {
                        ctx.moveTo(drawX, drawY);
                        first = false;
                    } else {
                        ctx.lineTo(drawX, drawY);
                    }
                });

                ctx.stroke();

                // Draw crossing points from precomputed t-values
                // For top/bottom edges, use xCrossings; for left/right, use yCrossings
                const crossingTs = (edge === 'top' || edge === 'bottom')
                    ? cycle.xCrossings
                    : cycle.yCrossings;

                crossingTs.forEach(crossingT => {
                    // Calculate what fraction through the sweep this crossing occurs
                    const crossingProgress = (crossingT + Math.PI) / (2 * Math.PI);

                    // Only draw if we've passed this crossing point
                    if (crossingProgress > currentProgress) return;

                    // Spread based on progress difference
                    const progressDiff = currentProgress - crossingProgress;
                    const spread = Math.min(progressDiff * maxSpread, maxSpread);

                    // Get exact position from function
                    const exactX = center + cycle.xFunc(crossingT) * scale;
                    const exactY = center - cycle.yFunc(crossingT) * scale;

                    let drawX, drawY;
                    if (edge === 'top') {
                        drawX = exactX;
                        drawY = (center - scale) - spread;
                    } else if (edge === 'bottom') {
                        drawX = exactX;
                        drawY = (center + scale) + spread;
                    } else if (edge === 'left') {
                        drawX = (center - scale) - spread;
                        drawY = exactY;
                    } else if (edge === 'right') {
                        drawX = (center + scale) + spread;
                        drawY = exactY;
                    }

                    // Draw the point
                    ctx.fillStyle = cycle.color;
                    ctx.beginPath();
                    ctx.arc(drawX, drawY, CONFIG.pointRadius, 0, 2 * Math.PI);
                    ctx.fill();

                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    ctx.strokeStyle = cycle.color;
                    ctx.lineWidth = CONFIG.visual.circleLineWidth;
                });
            });

            ctx.globalAlpha = 1;
        },

        drawAxes() {
            const { center, canvasSize } = dimensions;
            const margin = CONFIG.axisMargin * dimensions.getScaleFactor();

            ctx.strokeStyle = CONFIG.visual.axisColor;
            ctx.lineWidth = 1;

            // X axis
            ctx.beginPath();
            ctx.moveTo(margin, center);
            ctx.lineTo(canvasSize - margin, center);
            ctx.stroke();

            // Y axis
            ctx.beginPath();
            ctx.moveTo(center, margin);
            ctx.lineTo(center, canvasSize - margin);
            ctx.stroke();

            this.drawTickMarks();
        },

        drawTickMarks() {
            const { center, scale } = dimensions;
            const tickLen = CONFIG.tickLength;

            ctx.strokeStyle = CONFIG.visual.axisColor;
            ctx.lineWidth = 1;

            [-1, 1].forEach(i => {
                const x = center + i * scale;
                const y = center - i * scale;

                ctx.beginPath();
                ctx.moveTo(x, center - tickLen);
                ctx.lineTo(x, center + tickLen);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(center - tickLen, y);
                ctx.lineTo(center + tickLen, y);
                ctx.stroke();
            });
        },

        drawCircle(cycle, currentT) {
            const { center, scale } = dimensions;

            ctx.strokeStyle = cycle.color;
            ctx.lineWidth = CONFIG.visual.circleLineWidth;

            // Traced path
            ctx.globalAlpha = CONFIG.visual.sweepLineAlpha;
            ctx.beginPath();
            let first = true;
            for (let angle = -Math.PI; angle <= currentT; angle += CONFIG.arcStep) {
                const x = center + cycle.xFunc(angle) * scale;
                const y = center - cycle.yFunc(angle) * scale;
                if (first) { ctx.moveTo(x, y); first = false; }
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Ghost circle
            ctx.globalAlpha = CONFIG.visual.ghostCircleAlpha;
            ctx.beginPath();
            first = true;
            for (let angle = -Math.PI; angle <= Math.PI; angle += CONFIG.arcStep) {
                const x = center + cycle.xFunc(angle) * scale;
                const y = center - cycle.yFunc(angle) * scale;
                if (first) { ctx.moveTo(x, y); first = false; }
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.globalAlpha = 1;
        },

        drawCurrentPoint(cycle, t) {
            const { center, scale } = dimensions;
            const scaleFactor = dimensions.getScaleFactor();

            const xVal = cycle.xFunc(t);
            const yVal = cycle.yFunc(t);
            const x = center + xVal * scale;
            const y = center - yVal * scale;

            // Projection lines
            ctx.strokeStyle = cycle.color;
            ctx.lineWidth = 1;
            ctx.globalAlpha = CONFIG.visual.projectionAlpha;
            ctx.setLineDash([5, 5]);

            ctx.beginPath();
            ctx.moveTo(center, y);
            ctx.lineTo(x, y);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x, center);
            ctx.lineTo(x, y);
            ctx.stroke();

            ctx.setLineDash([]);
            ctx.globalAlpha = 1;

            // Projection labels
            this.drawProjectionLabels(x, y, xVal, yVal, cycle.color, scaleFactor);

            // Radius line
            ctx.strokeStyle = cycle.color;
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = CONFIG.visual.radiusLineAlpha;
            ctx.beginPath();
            ctx.moveTo(center, center);
            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.globalAlpha = 1;

            // Current point
            ctx.fillStyle = cycle.color;
            ctx.beginPath();
            ctx.arc(x, y, CONFIG.pointRadius, 0, 2 * Math.PI);
            ctx.fill();

            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
        },

        drawProjectionLabels(x, y, xVal, yVal, color, scaleFactor) {
            const { center } = dimensions;
            const offsets = CONFIG.projectionOffsets;
            const textScaleFactor = dimensions.getTextScaleFactor();

            ctx.fillStyle = color;
            ctx.font = Math.round(CONFIG.fonts.projection * textScaleFactor) + 'px sans-serif';
            ctx.globalAlpha = CONFIG.visual.projectionLabelAlpha;

            // Horizontal projection
            ctx.textAlign = 'center';
            const xLabelY = y > center ? y + offsets.labelBelow * scaleFactor : y - offsets.labelAbove * scaleFactor;
            ctx.fillText(xVal.toFixed(2), (center + x) / 2, xLabelY);

            // Vertical projection
            ctx.save();
            ctx.translate(x + (x > center ? offsets.labelSide * scaleFactor : -offsets.labelSide * scaleFactor), (center + y) / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.textAlign = 'center';
            ctx.fillText(yVal.toFixed(2), 0, 0);
            ctx.restore();

            ctx.globalAlpha = 1;
        },

        drawPops(pops) {
            const { visual, timing } = CONFIG;
            const now = performance.now();

            // Mutate in place for performance (avoid allocations every frame)
            for (let i = pops.length - 1; i >= 0; i--) {
                const pop = pops[i];
                const age = now - pop.createdAt;

                if (age > timing.popDuration) {
                    pops.splice(i, 1);
                    continue;
                }

                const progress = age / timing.popDuration;
                const size = visual.popStartSize + (visual.popEndSize - visual.popStartSize) * progress;

                ctx.globalAlpha = 1 - progress;
                ctx.fillStyle = pop.color;
                ctx.beginPath();
                ctx.arc(pop.x, pop.y, size, 0, 2 * Math.PI);
                ctx.fill();
            }

            ctx.globalAlpha = 1;
        },

        render(cycleIndex, parameterT, sweepProgress, pops, sineWaveHistory, fadingSineWaves) {
            const cycle = FUNCTION_CYCLES[cycleIndex];
            const edges = getActiveEdges(cycleIndex);
            const { center, scale } = dimensions;

            // Calculate current point position
            const xVal = cycle.xFunc(parameterT);
            const yVal = cycle.yFunc(parameterT);
            const x = center + xVal * scale;
            const y = center - yVal * scale;

            this.clear();
            this.drawSquare();
            this.drawAxes();

            // Draw fading sine waves from previous cycles
            const now = performance.now();
            fadingSineWaves.forEach(wave => {
                const age = now - wave.createdAt;
                const alpha = 1 - (age / CONFIG.timing.sineWaveFadeDuration);
                if (alpha > 0) {
                    // For fading waves, use 1.0 as progress since they completed
                    this.drawSineWaves(wave.points, wave.edges, wave.cycleIndex, 1.0, alpha);
                }
            });

            // Draw current sine waves
            this.drawSineWaves(sineWaveHistory, edges, cycleIndex, sweepProgress);

            // Draw edge projections
            this.drawEdgeProjections(x, y, edges);

            this.drawCircle(cycle, parameterT);
            this.drawCurrentPoint(cycle, parameterT);
            this.drawPops(pops);
        }
    };

    // ========================================
    // UI MODULE
    // ========================================

    const ui = {
        updateTickPositions() {
            const { center, scale } = dimensions;
            const scaleFactor = dimensions.getScaleFactor();
            const offsets = CONFIG.tickOffsets;

            elements.tickXPos.style.left = (center + scale + offsets.xPosLeft * scaleFactor) + 'px';
            elements.tickXPos.style.top = (center - offsets.xTop * scaleFactor) + 'px';
            elements.tickXPos.style.transform = 'translateY(-50%)';

            elements.tickXNeg.style.left = (center - scale - offsets.xNegLeft * scaleFactor) + 'px';
            elements.tickXNeg.style.top = (center - offsets.xTop * scaleFactor) + 'px';
            elements.tickXNeg.style.transform = 'translateY(-50%)';

            elements.tickYPos.style.left = (center - offsets.yLeft * scaleFactor) + 'px';
            elements.tickYPos.style.top = (center - scale - offsets.yPosTop * scaleFactor) + 'px';
            elements.tickYPos.style.transform = 'translateX(-100%)';

            elements.tickYNeg.style.left = (center - offsets.yLeft * scaleFactor) + 'px';
            elements.tickYNeg.style.top = (center + scale + offsets.yNegTop * scaleFactor) + 'px';
            elements.tickYNeg.style.transform = 'translateX(-100%)';
        },

        updateFontSizes() {
            const scaleFactor = dimensions.getTextScaleFactor();
            const tickSize = (CONFIG.fonts.tick * scaleFactor) + 'rem';
            const axisSize = (CONFIG.fonts.axisLabel * scaleFactor) + 'rem';

            elements.tickXPos.style.fontSize = tickSize;
            elements.tickXNeg.style.fontSize = tickSize;
            elements.tickYPos.style.fontSize = tickSize;
            elements.tickYNeg.style.fontSize = tickSize;
            elements.xAxisLabel.style.fontSize = axisSize;
            elements.yAxisLabel.style.fontSize = axisSize;
        },

        updateLabels(cycle) {
            elements.functionLabel.innerHTML = cycle.name;
            elements.xAxisLabel.innerHTML = cycle.xLabel;
            elements.yAxisLabel.innerHTML = cycle.yLabel;

            if (typeof MathJax !== 'undefined' && MathJax.typeset) {
                MathJax.typeset([elements.functionLabel, elements.xAxisLabel, elements.yAxisLabel]);
            }
        },

        updateAudioButton(enabled) {
            elements.audioIcon.innerHTML = enabled ? '&#x1F50A;' : '&#x1F507;';
            elements.audioButton.childNodes[1].textContent = enabled ? ' Music playing' : ' Play circle of fifths music';
            elements.audioButton.style.background = enabled ? CONFIG.colors.buttonActive : CONFIG.colors.buttonInactive;
        },

        handleResize() {
            dimensions.update();
            this.updateTickPositions();
            this.updateFontSizes();
        }
    };

    // ========================================
    // ANIMATION CONTROLLER
    // ========================================

    const controller = {
        createPop(noteIndex, cycle) {
            const { center, scale } = dimensions;
            const targetT = musicTheory.getAxisCrossingT(noteIndex);
            const xVal = cycle.xFunc(targetT);
            const yVal = cycle.yFunc(targetT);

            return {
                x: center + xVal * scale,
                y: center - yVal * scale,
                createdAt: performance.now(),
                color: cycle.color
            };
        },

        playNoteAndCreatePop() {
            const cycle = FUNCTION_CYCLES[state.cycleIndex];
            const key = musicTheory.getCurrentKey(state.fifthsIndex);
            const frequency = musicTheory.getArpeggioFrequency(key, state.noteIndex, cycle.ascending);

            audio.playBell(frequency);

            // Stop pad chord on first note of descending arpeggio
            if (!cycle.ascending && state.noteIndex === 0) {
                audio.stopPad();
            }

            state.pops.push(this.createPop(state.noteIndex, cycle));
            state.noteIndex++;
        },

        checkAndPlayNotes() {
            if (!audio.enabled) return;

            const adjustedProgress = state.sweepProgress + CONFIG.timing.earlyTriggerOffset;
            const currentQuarter = Math.floor(adjustedProgress * 4);

            if (currentQuarter !== state.lastProgressQuarter && currentQuarter >= 1 && currentQuarter <= 3) {
                this.playNoteAndCreatePop();
                state.lastProgressQuarter = currentQuarter;
            }

            if (state.sweepProgress >= CONFIG.timing.finalNoteProgress && !state.finalNotePlayed) {
                this.playNoteAndCreatePop();
                state.finalNotePlayed = true;
            }
        },

        resetForNextCycle() {
            // Move current sine wave to fading waves before reset
            if (state.sineWaveHistory.length > 0) {
                const cycle = FUNCTION_CYCLES[state.cycleIndex];
                state.fadingSineWaves.push({
                    points: state.sineWaveHistory.slice(),
                    color: cycle.color,
                    edges: getActiveEdges(state.cycleIndex),
                    cycleIndex: state.cycleIndex,  // Need this for crossing calculation
                    createdAt: performance.now()
                });
            }
            state.sineWaveHistory = [];

            state.sweepProgress = 0;
            state.parameterT = -Math.PI;
            state.lastProgressQuarter = -1;
            state.noteIndex = 0;
            state.finalNotePlayed = false;
            state.padStarted = false;
            state.phase = 'startPause';
            state.phaseStartTime = performance.now();

            state.cycleIndex = (state.cycleIndex + 1) % FUNCTION_CYCLES.length;

            if (state.cycleIndex % 2 === 0) {
                state.fifthsIndex = (state.fifthsIndex + 1) % 12;
            }
        },

        tick() {
            const now = performance.now();
            const elapsed = now - state.phaseStartTime;

            // Handle start pause
            if (state.phase === 'startPause') {
                if (elapsed >= CONFIG.timing.startPauseDuration) {
                    state.phase = 'sweep';
                    state.phaseStartTime = now;
                }
                return;
            }

            // Handle completion pause
            if (state.phase === 'completionPause') {
                if (elapsed >= CONFIG.timing.completionPauseDuration) {
                    this.resetForNextCycle();
                }
                return;
            }

            // Sweep phase - calculate progress from elapsed time
            const cycle = FUNCTION_CYCLES[state.cycleIndex];

            // Start pad chord at beginning of ascending cycles
            if (cycle.ascending && !state.padStarted && audio.enabled) {
                const key = musicTheory.getCurrentKey(state.fifthsIndex);
                audio.startPad(musicTheory.keyFrequencies[key][0]);
                state.padStarted = true;
            }

            // Calculate sweep progress from elapsed time
            state.sweepProgress = Math.min(elapsed / CONFIG.timing.cycleDuration, 1);
            state.parameterT = -Math.PI + state.sweepProgress * 2 * Math.PI;

            this.checkAndPlayNotes();

            if (state.sweepProgress >= 1) {
                state.phase = 'completionPause';
                state.phaseStartTime = now;
            }

            // Record current point position for sine wave history (in logical coordinates)
            const xVal = cycle.xFunc(state.parameterT);
            const yVal = cycle.yFunc(state.parameterT);
            state.sineWaveHistory.push({
                xVal: xVal,
                yVal: yVal,
                progress: state.sweepProgress
            });
        },

        animate() {
            this.tick();

            // Remove expired fading sine waves
            const now = performance.now();
            for (let i = state.fadingSineWaves.length - 1; i >= 0; i--) {
                const age = now - state.fadingSineWaves[i].createdAt;
                if (age >= CONFIG.timing.sineWaveFadeDuration) {
                    state.fadingSineWaves.splice(i, 1);
                }
            }

            renderer.render(
                state.cycleIndex,
                state.parameterT,
                state.sweepProgress,
                state.pops,
                state.sineWaveHistory,
                state.fadingSineWaves
            );

            // Update labels when cycle changes
            if (state.lastLabelCycleIndex !== state.cycleIndex) {
                ui.updateLabels(FUNCTION_CYCLES[state.cycleIndex]);
                state.lastLabelCycleIndex = state.cycleIndex;
            }

            requestAnimationFrame(() => this.animate());
        }
    };

    // ========================================
    // INITIALIZATION
    // ========================================

    // Set up event handlers
    elements.audioButton.addEventListener('click', () => {
        const enabled = audio.toggle();
        ui.updateAudioButton(enabled);
    });

    window.addEventListener('resize', () => ui.handleResize());

    // Initialize
    ui.handleResize();
    controller.animate();

})();
