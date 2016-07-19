# Wink Hub Onboarding
Sample [SmartThings](http://www.smartthings.com/) onboarding module for Open Translators to Things. May be used to discover devices connected to a SmartThings
where the IOTDB app has been installed (https://github.com/dpjanes/iotdb-smartthings) per the 
[org.OpenT2T.Onboarding.SmartThings.xml](https://github.com/openT2T/onboarding/blob/master/org.OpenT2T.Onboarding.SmartThings/org.OpenT2T.Onboarding.SmartThings.xml) schema.

See schema definition for inputs to the onboarding method, and outputs via success and error callbacks.

## Sample usage (via test.js script)
1. Battery Status of a device: node test -n 'My Sensor Battery' -f 'battery'
2. Lights: node test -n 'Front Door Light' -f 'switch'

