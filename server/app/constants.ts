import { Position } from './classes/position';

/* eslint-disable  @typescript-eslint/no-magic-numbers */

export type Bracket = [number, number];

export const DEFAULT_ID = 0;
export const RACK_LENGTH = 7;
export const MIDDLE_INDEX = 7;
export const MIDDLE = new Position(MIDDLE_INDEX, MIDDLE_INDEX);
export const ALL_LETTERS = Array.from({ length: 26 }, (_, i) => String.fromCharCode('A'.charCodeAt(0) + i));
export const PREVIOUS = -1;
export const INVALID_INDEX = -1;
export const AI_ID = 'VP';
export const DECIMAL_BASE = 10;
export const PROBABILITY = 10;
export const BOARD_LENGTH = 15;
export const DELAY_CHECK_TURN = 1000; // ms
export const DELAY_NO_PLACEMENT = 20000; // ms
export const HALF_PROBABILITY = 0.5;
export const ROW_CONTACT = 0;
export const COL_CONTACT = 1;
export const LETTER_PLACE_CONTACT = 2;
export const DATE_STRING_UNWANTED_CHARS_QTY = 5;
export const POINTS_OBJECTIVE_PALINDORME = 35;
export const POINTS_OBJECTIVE_ALREADY_ON_BOARD = 25;
export const POINTS_OBJECTIVE_3_VOWELS = 15;
export const POINTS_OBJECTIVE_ANAGRAM = 20;
export const POINTS_OBJECTIVE_ONLY_VOWELS = 10;
export const POINTS_OBJECTIVE_2_BIG_LETTERS = 50;
export const POINTS_OBJECTIVE_7_LETTERS_OR_MORE = 20;
export const POINTS_OBJECTIVE_NUMBER_OF_LETTER = 7;
export const POINTS_OBJECTIVE_CORNER_PLACEMENT = 15;
export const ROOMS_LIST_UPDATE_TIMEOUT = 200; // ms
export const UNDEFINED = -1;
export const TIMEOUT_DELETION = 5000; // ms
export const MAX_TOKEN_VALUE = 10000000; // 1 μs per request
export const DISCONNECTED_DELAY = 5000; // ms
export const MAIN_PLAYER = 0;
export const OTHER_PLAYER = 1;
export const PLAYER_0_TURN_PROBABILITY = 0.5;
export const MAX_SKIP_IN_A_ROW = 6;
export const MINIMUM_EXCHANGE_RESERVE_COUNT = 7;
export const SEC_TO_MS = 1000;
export const ASCII_LOWERCASE_A = 97;
export const HINT_NUMBER_OPTIONS = 3;
export const HALF_LENGTH = 7;
export const WORD_LENGTH_BONUS = 7;
export const BONUS_POINTS = 50;
export const NO_POINTS = 0;
export const BOARD_PLACEMENT_DELAY = 3000; // ms
export const PROBABILITY_OF_40 = 3;
export const PROBABILITY_OF_30 = 6;
export const LOWER_BOUND_INDEX = 0;
export const HIGHER_BOUND_INDEX = 1;
export const MIN_TO_MS = 60000;
export const LOWER_POINT_BRACKET: Bracket = [1, 6];
export const MIDDLE_POINT_BRACKET: Bracket = [7, 12];
export const HIGHER_POINT_BRACKET: Bracket = [13, 18];
export const VOWELS = new Set<string>(['a', 'e', 'i', 'o', 'u', 'y']);
export const BIG_POINTS = new Set<string>(['j', 'k', 'q', 'w', 'x', 'y', 'z']);
export const MULT_WORDS_3 = [
    [0, 0],
    [0, 7],
    [0, 14],
    [7, 0],
    [7, 14],
    [14, 0],
    [14, 7],
    [14, 14],
];
export const MULT_WORDS_2 = [
    [1, 1],
    [1, 13],
    [2, 2],
    [2, 12],
    [3, 3],
    [3, 11],
    [4, 4],
    [4, 10],
    [7, 7],
    [10, 4],
    [10, 10],
    [11, 3],
    [11, 11],
    [12, 2],
    [12, 12],
    [13, 1],
    [13, 13],
    [13, 13],
];
export const MULT_LETTERS_3 = [
    [1, 5],
    [1, 9],
    [5, 1],
    [5, 5],
    [5, 9],
    [5, 13],
    [9, 1],
    [9, 5],
    [9, 9],
    [9, 13],
    [13, 5],
    [13, 9],
];
export const MULT_LETTERS_2 = [
    [0, 3],
    [0, 11],
    [2, 6],
    [2, 8],
    [3, 0],
    [3, 7],
    [3, 14],
    [6, 2],
    [6, 6],
    [6, 8],
    [6, 12],
    [7, 3],
    [7, 11],
    [8, 2],
    [8, 6],
    [8, 8],
    [8, 12],
    [11, 0],
    [11, 7],
    [11, 14],
    [12, 6],
    [12, 8],
    [14, 3],
    [14, 11],
];
export const imgList: string[] = ['assets/icon-images/1.png', 'assets/icon-images/2.png', 'assets/icon-images/3.png', 'assets/icon-images/4.png'];
export const NUMBER_ICONS = 4;
