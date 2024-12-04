import Button from './js/button.js';
import Protobject from './js/protobject.js';

const audiBotton = new Button({
    text: 'Auudi',
    style: {
        backgroundColor: 'blue',
        color: 'white',
        padding: '10px 20px',
        width: "200px",
        height: "100px",
        top:0,
        left: 0,
    }
});




audiBotton.onPressed(() => {  moverServo(1300, 3000) });

function moverServo(speed, time){
    Protobject.send({speed: speed}).to('arduino.js')

    setTimeout(function(){ 
    Protobject.send({speed: 0}).to('arduino.js')
    }, time);
}