/**
 * Point Recording Engine - Single Source of Truth
 *
 * This engine manages the entire point recording flow.
 * UI should ONLY interact with this engine, never hardcode logic.
 *
 * Usage:
 * const engine = new PointRecordingEngine();
 * engine.startPoint('student');
 * const availableActions = engine.getAvailableActions();
 * engine.performAction('ace');
 * const winner = engine.getPointWinner();
 */

import { PointCreate } from '../types';

// ============================================
// TYPES
// ============================================

export type RecordingPhase =
    | 'idle'
    | 'first_serve'
    | 'second_serve'
    | 'return'
    | 'final_stroke'
    | 'completed';

export type ServeResult = 'ace' | 'fault' | 'let' | 'in' | 'double_fault';
export type ReturnResult = 'error' | 'in';
export type FinalStrokeResult = 'winner' | 'forced_error' | 'unforced_error' | 'net';

export interface AvailableAction {
    id: string;
    label: string;
    description?: string;
    category?: 'success' | 'warning' | 'error' | 'neutral';
}

export interface RecordingState {
    phase: RecordingPhase;
    server: 'student' | 'opponent';
    serveType: 'first' | 'second';
    serveResult?: ServeResult;
    returnResult?: ReturnResult;
    finalStroke?: {
        player: 'student' | 'opponent';
        type: string;
        direction: string;
        result: FinalStrokeResult;
    };
    pointWinner?: 'student' | 'opponent';
    isComplete: boolean;
}

// ============================================
// ENGINE
// ============================================

export class PointRecordingEngine {
    private state: RecordingState;

    constructor() {
        this.state = this.getInitialState();
    }

    // ============================================
    // STATE MANAGEMENT
    // ============================================

    private getInitialState(): RecordingState {
        return {
            phase: 'idle',
            server: 'student',
            serveType: 'first',
            isComplete: false,
        };
    }

    /**
     * Start recording a new point
     */
    startPoint(server: 'student' | 'opponent'): void {
        this.state = {
            phase: 'first_serve',
            server,
            serveType: 'first',
            isComplete: false,
        };
    }

    /**
     * Jump directly to final stroke recording
     */
    startFinalStroke(serveType: 'first' | 'second' = 'first'): void {
        this.state.phase = 'final_stroke';
        this.state.serveType = serveType;
        this.state.serveResult = 'in';
        this.state.returnResult = 'in';
        this.state.isComplete = false;
    }

    /**
     * Get current recording state
     */
    getState(): RecordingState {
        return { ...this.state };
    }

    /**
     * Reset engine for next point
     */
    reset(): void {
        this.state = this.getInitialState();
    }

    // ============================================
    // AVAILABLE ACTIONS (UI reads this!)
    // ============================================

    /**
     * Get all available actions for current phase
     * UI uses this to render buttons dynamically
     */
    getAvailableActions(): AvailableAction[] {
        switch (this.state.phase) {
            case 'first_serve':
                return this.getFirstServeActions();

            case 'second_serve':
                return this.getSecondServeActions();

            case 'return':
                return this.getReturnActions();

            case 'final_stroke':
                return this.getFinalStrokeActions();

            case 'completed':
            case 'idle':
                return [];

            default:
                return [];
        }
    }

    private getFirstServeActions(): AvailableAction[] {
        return [
            {
                id: 'ace',
                label: 'ایس (Ace)',
                description: 'امتیاز مستقیم سرویس اول',
                category: 'success',
            },
            {
                id: 'in',
                label: 'داخل زمین (In Play)',
                description: 'سرویس وارد زمین شد و رالی شروع شد',
                category: 'neutral',
            },
            {
                id: 'fault',
                label: 'خطای سرویس اول (Fault)',
                description: 'سرویس خطا شد، رفتن به سرویس دوم',
                category: 'error',
            },
            {
                id: 'let',
                label: 'نت / تکرار (Let)',
                description: 'برخورد به تور و افتادن در زمین، تکرار سرویس',
                category: 'warning',
            },
        ];
    }

    private getSecondServeActions(): AvailableAction[] {
        return [
            {
                id: 'ace',
                label: 'ایس (Ace)',
                description: 'امتیاز مستقیم سرویس دوم',
                category: 'success',
            },
            {
                id: 'in',
                label: 'داخل زمین (In Play)',
                description: 'سرویس دوم وارد زمین شد',
                category: 'neutral',
            },
            {
                id: 'double_fault',
                label: 'دوبل فالت (Double Fault)',
                description: 'خطای سرویس دوم، امتیاز به حریف',
                category: 'error',
            },
            {
                id: 'let',
                label: 'نت / تکرار (Let)',
                description: 'تکرار سرویس دوم',
                category: 'warning',
            },
        ];
    }

    private getReturnActions(): AvailableAction[] {
        return [
            {
                id: 'in',
                label: 'دریافت موفق / ادامه رالی (In Play)',
                description: 'توپ دریافت شد و رالی ادامه یافت',
                category: 'success',
            },
            {
                id: 'error',
                label: 'خطای دریافت (Return Error)',
                description: 'دریافت سرویس خطا شد، امتیاز برای زننده سرویس',
                category: 'error',
            },
        ];
    }

    private getFinalStrokeActions(): AvailableAction[] {
        return [
            {
                id: 'select_player',
                label: 'انتخاب بازیکن',
                description: 'چه کسی ضربه نهایی را زد؟',
            },
            {
                id: 'select_type',
                label: 'تکنیک ضربه',
                description: 'نوع ضربه',
            },
            {
                id: 'select_direction',
                label: 'جهت / تاکتیک',
                description: 'جهت ضربه',
            },
            {
                id: 'select_result',
                label: 'نتیجه ضربه',
                description: 'نتیجه رالی',
            },
        ];
    }

    // ============================================
    // PERFORM ACTIONS
    // ============================================

    /**
     * Perform an action and transition to next state
     */
    performAction(actionId: string): boolean {
        switch (this.state.phase) {
            case 'first_serve':
                return this.handleFirstServe(actionId as ServeResult);

            case 'second_serve':
                return this.handleSecondServe(actionId as ServeResult);

            case 'return':
                return this.handleReturn(actionId as ReturnResult);

            case 'final_stroke':
                return false;

            default:
                return false;
        }
    }

    private handleFirstServe(result: ServeResult): boolean {
        switch (result) {
            case 'ace':
                this.state.serveResult = 'ace';
                this.state.pointWinner = this.state.server;
                this.state.phase = 'completed';
                this.state.isComplete = true;
                return true;

            case 'let':
                return true;

            case 'fault':
                this.state.serveResult = 'fault';
                this.state.phase = 'second_serve';
                this.state.serveType = 'second';
                return true;

            case 'in':
                this.state.serveResult = 'in';
                this.state.phase = 'return';
                return true;

            default:
                return false;
        }
    }

    private handleSecondServe(result: ServeResult): boolean {
        switch (result) {
            case 'ace':
                this.state.serveResult = 'ace';
                this.state.pointWinner = this.state.server;
                this.state.phase = 'completed';
                this.state.isComplete = true;
                return true;

            case 'let':
                return true;

            case 'double_fault':
                this.state.serveResult = 'double_fault';
                this.state.pointWinner = this.state.server === 'student' ? 'opponent' : 'student';
                this.state.phase = 'completed';
                this.state.isComplete = true;
                return true;

            case 'in':
                this.state.serveResult = 'in';
                this.state.phase = 'return';
                return true;

            default:
                return false;
        }
    }

    private handleReturn(result: ReturnResult): boolean {
        switch (result) {
            case 'error':
                this.state.returnResult = 'error';
                this.state.pointWinner = this.state.server;
                this.state.phase = 'completed';
                this.state.isComplete = true;
                return true;

            case 'in':
                this.state.returnResult = 'in';
                this.state.phase = 'final_stroke';
                return true;

            default:
                return false;
        }
    }

    /**
     * Set final stroke data (for final_stroke phase)
     */
    setFinalStroke(data: {
        player: 'student' | 'opponent';
        type: string;
        direction: string;
        result: FinalStrokeResult;
    }): boolean {
        if (this.state.phase !== 'final_stroke') {
            return false;
        }

        this.state.finalStroke = data;

        // Calculate point winner based on final stroke result
        switch (data.result) {
            case 'winner':
                this.state.pointWinner = data.player;
                break;

            case 'forced_error':
                this.state.pointWinner = data.player;
                break;

            case 'unforced_error':
            case 'net':
                this.state.pointWinner = data.player === 'student' ? 'opponent' : 'student';
                break;
        }

        this.state.phase = 'completed';
        this.state.isComplete = true;
        return true;
    }

    // ============================================
    // GET POINT DATA
    // ============================================

    /**
     * Get point winner (if completed)
     */
    getPointWinner(): 'student' | 'opponent' | null {
        return this.state.pointWinner || null;
    }

    /**
     * Check if point is complete
     */
    isPointComplete(): boolean {
        return this.state.isComplete;
    }

    /**
     * Get current phase
     */
    getCurrentPhase(): RecordingPhase {
        return this.state.phase;
    }

    /**
     * Convert current state to PointCreate for API
     */
    toPointCreate(
        matchId: number | string,
        pointNumber: number,
        setNumber: number,
        gameNumber: number,
        gameScore: string
    ): PointCreate | null {
        if (!this.state.isComplete || !this.state.pointWinner) {
            return null;
        }

        return {
            match_id: typeof matchId === 'number' ? matchId : parseInt(String(matchId), 10),
            point_number: pointNumber,
            set_number: setNumber,
            game_number: gameNumber,
            game_score: gameScore,
            server: this.state.server,
            serve_type: this.state.serveType,
            serve_result: this.state.serveResult,
            return_result: this.state.returnResult,
            final_stroke_player: this.state.finalStroke?.player,
            final_stroke_type: this.state.finalStroke?.type,
            final_stroke_direction: this.state.finalStroke?.direction,
            final_stroke_result: this.state.finalStroke?.result,
            point_winner: this.state.pointWinner,
        };
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Get display text for current phase
     */
    getPhaseDisplayText(): string {
        switch (this.state.phase) {
            case 'idle':
                return 'آماده شروع امتیاز';
            case 'first_serve':
                return 'سرویس اول (First Serve)';
            case 'second_serve':
                return 'سرویس دوم (Second Serve)';
            case 'return':
                return 'دریافت سرویس (Return)';
            case 'final_stroke':
                return 'ضربه پایانی رالی (Final Stroke)';
            case 'completed':
                return 'امتیاز ثبت شد';
            default:
                return '';
        }
    }

    /**
     * Get server name for display
     */
    getServerName(studentName: string, opponentName: string): string {
        return this.state.server === 'student' ? studentName : opponentName;
    }

    /**
     * Get receiver name for display
     */
    getReceiverName(studentName: string, opponentName: string): string {
        return this.state.server === 'student' ? opponentName : studentName;
    }
}
