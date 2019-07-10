void setup(){
  Serial.begin(9600);
  pinMode(LED_BUILTIN,OUTPUT);
  pinMode(8,OUTPUT);
}

void loop(){
  while(Serial.available() > 0 ){
    String str = Serial.readString();
    if(str.substring(0) == "1\n"){
      Serial.println("identified usb1 spindle off");

      digitalWrite(LED_BUILTIN,HIGH);
      digitalWrite(8,HIGH);
    }else if(str.substring(0) == "2\n"){
      Serial.println("identified usb2 spindle off");
      digitalWrite(LED_BUILTIN,LOW);
      digitalWrite(8,LOW);
    }
  }
}
