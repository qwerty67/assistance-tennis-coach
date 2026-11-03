import { ValidValues } from '../types';

// API Configuration
export const API_BASE_URL = 'https://tennis-pilot.liara.run/api';
// export const API_BASE_URL = 'http://10.241.245.19:8000/api';
// export const API_BASE_URL = 'http://192.168.1.11:8000/api';

// Colors
export const COLORS = {
    primary: '#2196F3',
    secondary: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',
    success: '#4CAF50',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#212121',
    textSecondary: '#757575',
    border: '#E0E0E0',
};

// Tennis Valid Values
export const VALID_VALUES: ValidValues = {
    players: ['student', 'opponent'],
    serve_types: ['first', 'second'],
    serve_results: ['ace', 'fault', 'let', 'in', 'double_fault'],
    return_results: ['error', 'in'],
    stroke_types: [
        'forehand', 'backhand', 'slice', 'drop_shot', 'lob', 'passing_shot',
        'forehand_volley', 'backhand_volley', 'half_volley', 'drive_volley',
        'swing_volley', 'smash'
    ],
    directions: [
        'cross_court', 'down_the_line', 'inside_out', 'inside_in',
        'middle', 'short_angle'
    ],
    final_stroke_results: ['winner', 'forced_error', 'unforced_error', 'net'],
    match_status: ['ongoing', 'completed', 'abandoned'],
    match_results: ['win', 'loss', 'draw'],
};