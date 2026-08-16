import { COUNT } from "./count"

// https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_code_values
// Mobile keys not added, see them at https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_code_values#code_values_on_firefox_for_android
export type DESKTOPKEY = 
"Escape" |
`Digit${ADIGIT}` |
"Minus"|
"Equal"|
"Backspace" |
"Space"| 
"CapsLock"|
"Tab" |
`Key${ELETTER}`|
`Bracket${XDIR}`|
"Enter"|
`Control${XDIR}` |
"Semicolon"|
`${""|"Back"}Quote`|
`Shift${XDIR}`|
"Comma"|
"Period"|
"Slash"|
`Numpad${NUMPADPOSSIBLE}`|
`Alt${XDIR}`|
"CapsLock"|
`F${FUNCTIONDIGIT}` |
"Pause"|
"ScrollLock"|
"LaunchMail"|
`Numpad${ADIGIT}`|
`Intl${INTL}`|
"KanaMode"|
`Lang${LANG}`|
`${""|"Non"}Convert` |
"AudioVolumeMute"|
`LaunchApp${1|2}`|
`Media${"Stop"|"PlayPause"|`Track${"Previous"|"Next"}`|"Select"}`|
`Volume${YDIR}`|
`Home`|
`Browser${"Home"|"Search"|"Favourites"|"Refresh"|"Stop"|"Forward"|"Back"}`|
"PrintScreen"|
"NumLock"|
"Pause"|
`Arrow${YDIR|XDIR}`|
`Page${YDIR}`|
"End"|
"Insert"|
"Delete"|
`Meta${XDIR}`|
"ContextMenu"|
"Power"
export type INTL = "Backlash"| "Ro" | "Yen"
// note: on firefox 3-4 lang are unavailable
export type YDIR = "Up"|"Down"
export type LANG = 1|2|3|4
export type NUMPADPOSSIBLE = "Add"|"Subtract"|"Multiply"|"Decimal"|"Equal"|"Comma"|"Enter"|"Divide"
export type XDIR =  "Left"|"Right"
export type ELETTER = "A"|"B"|"C"|"D"|"E"|"F"|"G"|"H"|"I"|"J"|"K"|"L"|"M"|"N"|"O"|"P"|"Q"|"R"|"S"|"T"|"U"|"V"|"W"|"X"|"Y"|"Z"
export type ADIGIT = Exclude<COUNT<9>,0>
export type FUNCTIONDIGIT = Exclude<COUNT<24>,0>
