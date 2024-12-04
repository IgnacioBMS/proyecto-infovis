import Arduino from './js/arduino.js';
import Protobject from './js/protobject.js';

Arduino.start();
Protobject.onReceived((data) => {
    Arduino.contServoWrite({ pin: 6, 
                        value: data.speed });
									});