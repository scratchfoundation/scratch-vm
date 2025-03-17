const ArgumentType  = require('../../extension-support/argument-type');
const BlockType     = require('../../extension-support/block-type');
const Cast          = require('../../util/cast');
const languageNames = require('scratch-translate-extension-languages');
const formatMessage = require('format-message');
const ROSLIB        = require('rclnodejs'); // ROS2用に変更

const Clone          = require('../../util/clone');
const Color          = require('../../util/color');
const MathUtil       = require('../../util/math-util');
const RenderedTarget = require('../../sprites/rendered-target');
const log            = require('../../util/log');
const StageLayering  = require('../../engine/stage-layering');
const WEBVideoViewer = require('./web_video_viewer');

const iconURI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAYAAADE6YVjAAAFWUlEQVRIS61We0xTZxQ/X+9te/sQKkhrQB7bTDSK1lDEEN9OZRkxMjDMiCEqAo2CcVuyuSXqNo2vGLYZ4vSPLcYlJkMckyIP/4D4DxEpD6XoDEGNmOiq0Fqgt697v+V8pQwdCsk8yU1u7ved8zuP3znnEniLDAwMaM6fOTPH5XZbRv1+cygYXOj3+2N4jhNVgnBfp9P16LXa22aL5X5BQYHrTabIZAeUUnLk0KE0R2/vpkGXK+eZ0znf4/EoA4EAcBxHZFkGQgiNioqCWbGxT41xcfUJ8fE1O4qKbqSnp3tft/kfEJvNpm2qqyts7+qyPn32zDw6OgpKpRJUKhUoFIpxfUopIGgwGARBECA2JubJvLlzqz/MyqosLS3tnwj0CkhVVZW+6tKlg7cdjhKX221AZQQgRAGUypNmA8+CoSD4/X4Q1GpISUy0Wffu/Xrbtm29EYVxELvdrjxy+PDhbofjc1EUNVqtlt1Bj6cSQgimjwFhdAvmzastKy3dn19Y+BB1x0E+KysrqmtsPOXyeGJm6HTMropFMWnZXsFFRzBt6A4CUVmGdIvl7NFjx740m82jzELFiROLLtfU/Hq/ry8di4mGZxoMoNfrpxWNghDwer0w6HKztGIdY2NjX65dtWr32fPnqwmllMvNydnX1d1dgaGq1GoWgclkAl6pBGTSVIJOofdOpxO8Ph9Lj8fjgcyMjMsFhYXl5Ifjx1Oampt/a+/sXIFRyJSCWqUCk9EICp5nylMKppRSePH8OYx6vcBxPIyMDMOchISX61av3kL2l5Wtab15s+HBo0dCVFQ0SLLEQIxGI3DTBGGRTABBqodCIZBCIXlLXt73pHzPnjJbff2PgVCIU2N6xiL5vyAY/fDwsJy1fn0DKd616+fGpqYSwnEKjuPeKYhXFGnm0gw7Kdi69VJrW9unkiS9cxDR56NpixffISVFRecarl8vJoSMgwhYE5MJFBw3rcKzXqIUnmPhRRGQ0ijjkZRbrfvqGhsr/GM1wQLyPA+zTSZG5+lSWA6F4G+nE0S/fxwEa7Jh3boGUma1rrlltzc8ePxYwE5Howik1+nYA8ict3AYfcYHm9EzMsJuRtglS5Kcl5t7JNwnLS0Xb9ntK6OjkcIySxECRWYSvr8+wyJnYyOBEQYdwlTxvBI8I8OQFOkT7Pgtubn72traKpRqNViWLGF6CIZ5RkVZktjgi0wxjAyZqFSpwnfYFAwD4Pfee/dg4MkTWLlixeWC7dvLI7Nr4e/V1b/81de37OOsLEhdsABEb3j3+AMBNmLSMjLCxrCPBAEe9vfD7c5O1rgIgN8FrZYZ//PaNYiJjnZv3LBh90+VlVdemcI1Ntsp0eeLydu8GeJmxYFP9ELA54fEpCRYu3EjUKCsZjq9Hu46HHCjuZktLBTcJThSauvrYXBoCJZnZp49fvLkV6mpqSPjIC0tLXzF6dPftrW3fzHTYBA2Z2eDVhAggCOc0nDOx4qMb6zgY5uS5zh2dr25GXru3gWL2VxbbLXuL3x9n+Clq1evzrh44cLBjo6O4qTZCYb3PkqDgbggBEGC918IkOLSgMiHB2YEhC1kQqCjuxt6HA74ICWlrrSk5JvtO3f2REg56Y6vrakpvHOnp9THSUtcVGQpN4AGNBIPFK0i2wAgGB6CbEXLkjSQnJx8JSc7u3LH23b8xHY4cOCAxWHv3jTqcn/iHByaPzTykg8S+V+GUQparZaajManMdHRjUnJyX98d/Tojfj4+Kn/ViYCtba2aqqrqxOHh92Lgv7Q0mAgEB8IBDScQhFUaTQvBLXaMUOn61q2fHl/fn7+0Jt69h+a0LqPu9pEAgAAAABJRU5ErkJggg==';

class Turtlebot {

      constructor(){
        rclnodejs.init();
        this.node = new rclnodejs.Node('scratch_ros2_node');

        this.publisher_ = this.node.createPublisher('std_msgs/msg/String', '/scratch_ros');
        this.subscriber_ = this.node.createSubscription(
            'std_msgs/msg/String',
            '/ros_scratch',
            message => { this.analysisRosMessage(message); }
        );

        rclnodejs.spin(this.node);

        this.ipAddress = null;
        this.isRobotMoving = false;
        this.isButton0Push    = false;
        this.isButton1Push    = false;
        this.isButton2Push    = false;
        this.isfrontBumperHit = false;
        this.isLeftBumperHit  = false;
        this.isRightBumperHit = false;
        this.isRobotPoseX = 0.0;
        this.isRobotPoseY = 0.0;
        this.isRobotAngle = 0.0;
        this.isQrdistance = 0;
        this.isQrwidth = 0;
        this.isQrangle = 0.0;
        this.isImageBAve = 0;
        this.isImageGAve = 0;
        this.isImageRAve = 0;
        this.isQrrecod = "";
        this.isSpeech = "";
        this.isRecognitionWord = "";
        this.isImageCommonColor = "";

    }

    setRosIp(ipAddress){
        this.ros_ = new ROSLIB.Ros({url: 'ws://' + ipAddress + ':9090'});
        this.ros_.on('connection', function() { console.log('Connected to rosbridge server.');});
        this.ros_.on('error', function(error) { console.log('Error connecting to rosbridge server: ', error);});
        this.ros_.on('close', function() {      console.log('Connection of rosbridge was closed.');});

        //Publisher and Subscliber
        this.publisher_  = new ROSLIB.Topic({ ros:this.ros_, name:'/scratch_ros', messageType:'std_msgs/String'});
        this.subscliber_ = new ROSLIB.Topic({ ros:this.ros_, name:'/ros_scratch', messageType:'std_msgs/String'});
        this.subscliber_.subscribe(message => { this.analysisRosMessage(message); });
        this.ipAddress = ipAddress;
        console.log('Turtlebot setRosIp : ' + ipAddress);
    }

    closeRosIp(){
        rclnodejs.shutdown();
        console.log('ROS2ノードをシャットダウンしました。');
    }

    analysisRosMessage(message){
        const receivedData = message.data;
        console.log('ROS2からメッセージ受信:', receivedData);

        if (this.isDataContainKeyword(receivedData,'arrival')){ this.isRobotMoving = false; }
        else if(this.isDataContainKeyword(receivedData,'front_bumper:true')){   this.isfrontBumperHit  = true;  }
        else if(this.isDataContainKeyword(receivedData,'front_bumper:false')){  this.isfrontBumperHit  = false; }
        else if(this.isDataContainKeyword(receivedData,'left_bumper:true')){    this.isLeftBumperHit = true;  }
        else if(this.isDataContainKeyword(receivedData,'left_bumper:false')){   this.isLeftBumperHit = false; }
        else if(this.isDataContainKeyword(receivedData,'right_bumper:true')){   this.isRightBumperHit  = true;  }
        else if(this.isDataContainKeyword(receivedData,'right_bumper:false')){  this.isRightBumperHit  = false; }

        else if(this.isDataContainKeyword(receivedData,'button_0:true')){   this.isButton0Push = true;  }
        else if(this.isDataContainKeyword(receivedData,'button_0:false')){  this.isButton0Push = false; }
        else if(this.isDataContainKeyword(receivedData,'button_1:true')){   this.isButton1Push  = true;  }
        else if(this.isDataContainKeyword(receivedData,'button_1:false')){  this.isButton1Push  = false; }
        else if(this.isDataContainKeyword(receivedData,'button_2:true')){   this.isButton2Push = true;  }
        else if(this.isDataContainKeyword(receivedData,'button_2:false')){  this.isButton2Push = false; }

        else if(this.isDataContainKeyword(receivedData,'robot_pose_x:')){
          this.isRobotPoseX = Number(receivedData.slice(13));
        }
        else if(this.isDataContainKeyword(receivedData,'robot_pose_y:')){
          this.isRobotPoseY = Number(receivedData.slice(13));
        }
        else if(this.isDataContainKeyword(receivedData,'robot_angle:')){
          this.isRobotAngle = Number(receivedData.slice(12));
        }
        else if(this.isDataContainKeyword(receivedData,'qr_distance:')){
          this.isQrdistance = Number(receivedData.slice(12));
        }
        else if(this.isDataContainKeyword(receivedData,'qr_width:')){
          this.isQrwidth = Number(receivedData.slice(9));
        }
        else if(this.isDataContainKeyword(receivedData,'qr_angle:')){
          this.isQrangle = Number(receivedData.slice(9));
        }
        else if(this.isDataContainKeyword(receivedData,'qr_recode:')){
          this.isQrrecod = String(receivedData.slice(10));
        }
        else if(this.isDataContainKeyword(receivedData,'speech:')){
          this.isSpeech = String(receivedData.slice(7));
        }
        else if(this.isDataContainKeyword(receivedData,'recognition_word:')){
          this.isRecognitionWord = String(receivedData.slice(17));
        }
        else if(this.isDataContainKeyword(receivedData,'image_b_ave:')){
          this.isImageBAve = Number(receivedData.slice(12));
        }
        else if(this.isDataContainKeyword(receivedData,'image_g_ave:')){
          this.isImageGAve = Number(receivedData.slice(12));
        }
        else if(this.isDataContainKeyword(receivedData,'image_r_ave:')){
          this.isImageRAve = Number(receivedData.slice(12));
        }
        else if(this.isDataContainKeyword(receivedData,'image_common_color:')){
          this.isImageCommonColor = String(receivedData.slice(19));
        }

    }

    isDataContainKeyword(data, keyword){
        if(data.indexOf(keyword) != -1){return true;}
        else{return false;}
    }

    publishScratchRos(message){
        const rosMsg = { data: message };
        this.publisher_.publish(rosMsg);
    }

}//Turtlebot


class Scratch3TurtleBotBlocks {

    constructor(runtime) {
        this.runtime_ = runtime;
        this.turtlebot_ = new Turtlebot();
    }

    stopProgram(){ this.turtlebot_.publishScratchRos("motion_stop:True"); }

    setRosDomain(domainId) {
      process.env.ROS_DOMAIN_ID = String(domainId);
      if (rclnodejs.isInitialized()) {
          rclnodejs.shutdown();
      }
      rclnodejs.init();
      this.node = new rclnodejs.Node('scratch_ros2_node_' + domainId);
  
      this.publisher_ = this.node.createPublisher('std_msgs/msg/String', '/scratch_ros');
      this.subscriber_ = this.node.createSubscription(
          'std_msgs/msg/String',
          '/ros_scratch',
          message => { this.analysisRosMessage(message); }
      );
  
      rclnodejs.spin(this.node);
      this.domainId = domainId;
      console.log('ROS2ノードがROS_DOMAIN_ID:', domainId, 'で初期化されました。');
  }

    setROSIP(args) {
        let domainMap = {
            "TurtleBot": 0,
            "TurtleBot_1": 1,
            "TurtleBot_2": 2,
            "TurtleBot_3": 3,
            "TurtleBot_4": 4,
            "TurtleBot_5": 5,
            "TurtleBot_6": 6,
            "TurtleBot_7": 7,
            "TurtleBot_8": 8,
            "TurtleBot_9": 9,
            "TurtleBot_10": 10,
            "TurtleBot_11": 11,
            "TurtleBot_test": 100
        };
        let domainId = domainMap[args.TURTLEBOT_NAME] || 0;
        this.turtlebot_.setRosDomain(domainId);
    }
    closeROSIP(args) {
        this.turtlebot_.closeRosDomain();
    }
    closeRosDomain() {
        if (rclnodejs.isInitialized()) {
            rclnodejs.shutdown();
            console.log('ROS2ノードがシャットダウンされました。(Domain ID:', this.domainId, ')');
        } else {
            console.log('ROS2ノードは既にシャットダウンされています。');
        }
    }
    stopMotion() {
        this.turtlebot_.publishScratchRos("motion_stop:True");
    }

    pushBumper (args) {
        if(String(args.TURTLEBOT_BUMPER) == "前方"){    return this.turtlebot_.isfrontBumperHit; }
        else if(String(args.TURTLEBOT_BUMPER) == "右"){ return this.turtlebot_.isRightBumperHit; }
        else if(String(args.TURTLEBOT_BUMPER) == "左"){ return this.turtlebot_.isLeftBumperHit; }
    }

    boolBumper (args) {
        if(String(args.TURTLEBOT_BUMPER) == "前方"){    return this.turtlebot_.isfrontBumperHit; }
        else if(String(args.TURTLEBOT_BUMPER) == "右"){ return this.turtlebot_.isRightBumperHit; }
        else if(String(args.TURTLEBOT_BUMPER) == "左"){ return this.turtlebot_.isLeftBumperHit; }
    }//boolBumper

    pushButton (args) {//HAT
        if(String(args.TURTLEBOT_BUTTON) == "0"){      return this.turtlebot_.isButton0Push; }
        else if(String(args.TURTLEBOT_BUTTON) == "1"){ return this.turtlebot_.isButton1Push; }
        else if(String(args.TURTLEBOT_BUTTON) == "2"){ return this.turtlebot_.isButton2Push; }
    }

    boolButton (args) {//BOOLEAN
        if(String(args.TURTLEBOT_BUTTON) == "0"){      return this.turtlebot_.isButton0Push; }
        else if(String(args.TURTLEBOT_BUTTON) == "1"){ return this.turtlebot_.isButton1Push; }
        else if(String(args.TURTLEBOT_BUTTON) == "2"){ return this.turtlebot_.isButton2Push; }
    }

    pubLED (args) {
        if(String(args.TURTLEBOT_LED) == "消灯"){    this.turtlebot_.publishScratchRos("LED:off");    }
        else if(String(args.TURTLEBOT_LED) == "緑"){ this.turtlebot_.publishScratchRos("LED:green");  }
        else if(String(args.TURTLEBOT_LED) == "黃"){ this.turtlebot_.publishScratchRos("LED:yellow"); }
        else if(String(args.TURTLEBOT_LED) == "赤"){ this.turtlebot_.publishScratchRos("LED:red");    }
    }

    pubSound (args) {
        if(String(args.TURTLEBOT_SOUND) == "スイッチON"){       this.turtlebot_.publishScratchRos("sound:0"); }
        else if(String(args.TURTLEBOT_SOUND) == "スイッチOFF"){ this.turtlebot_.publishScratchRos("sound:1"); }
        else if(String(args.TURTLEBOT_SOUND) == "充電中"){     this.turtlebot_.publishScratchRos("sound:2"); }
        else if(String(args.TURTLEBOT_SOUND) == "ボタン"){      this.turtlebot_.publishScratchRos("sound:3"); }
        else if(String(args.TURTLEBOT_SOUND) == "エラー"){      this.turtlebot_.publishScratchRos("sound:4"); }
        else if(String(args.TURTLEBOT_SOUND) == "休憩"){       this.turtlebot_.publishScratchRos("sound:5"); }
        else if(String(args.TURTLEBOT_SOUND) == "驚き"){       this.turtlebot_.publishScratchRos("sound:6"); }
    }

    pubGo_straight (args) {

        this.turtlebot_.publishScratchRos("S:"+String(args.GO_STRAIGHT));

        var targetLength = Number(args.GO_STRAIGHT);
        if(targetLength < 0){ targetLength *= -1; }
        var marginTime  = 2;//[sec]
        var movingSpeed = 30;//[cm/sec]
        var sleepTime   = ((targetLength / movingSpeed) + marginTime) * 1000;

        return new Promise(resolve => { setTimeout(() => {resolve();}, sleepTime); });
    }

    pubAngle (args) {
        this.turtlebot_.publishScratchRos("T:"+String(args.TURTLEBOT_ANGLE));

        var targetAngle = Number(args.TURTLEBOT_ANGLE);
        if(targetAngle < 0){ targetAngle *= -1; }
        var marginTime   = 1.5;
        var stepNum      = 10;
        var increaseRate = 0.5;
        var sleepTime    =  ((targetAngle / stepNum * increaseRate) + marginTime) * 1000;

        return new Promise(resolve => { setTimeout(() => {resolve();}, sleepTime); });
	  }

    pubCmdVel(args){
        var targetVel = Number(args.VEL_VALUE);
        var targetRad = Number(args.RAD_VALUE);

        if(targetVel < -35){ targetVel = -35; }
        if(targetVel >  35){ targetVel =  35; }
        if(targetRad < -35){ targetRad = -35; }
        if(targetRad >  35){ targetRad =  35; }

        this.turtlebot_.publishScratchRos("turtlebot_cmd_vel:" + String(targetVel) + ',' + String(targetRad));
    }

    pubMove_speed (args) {
        var Move_speedVel = Number(args.MOVING_SPEED);

        if(Move_speedVel < -35){ Move_speedVel = -35; }
        if(Move_speedVel >  35){ Move_speedVel =  35; }

        this.turtlebot_.publishScratchRos("move_speed:"+String(Move_speedVel));
    }

    pubRotation_speed (args) {
        var Rotation_speedVel = Number(args.ROTATION_SPEED);

        if(Rotation_speedVel < -35){ Rotation_speedVel = -35; }
        if(Rotation_speedVel >  35){ Rotation_speedVel =  35; }

        this.turtlebot_.publishScratchRos("rotation_speed:"+String(Rotation_speedVel));
    }

    pubOdome_Initialize (args) {
      this.turtlebot_.publishScratchRos("odome_initialize");
    }

    subRobotPoseX (args) {
        return this.turtlebot_.isRobotPoseX;
    }

    subRobotPoseY (args) {
        return this.turtlebot_.isRobotPoseY;
    }

    subRobotAngle (args) {
        return this.turtlebot_.isRobotAngle;
    }

    drawImage(args) {
      //ip
  		let ip = this.turtlebot_.ipAddress;
  		console.log(ip);
  		if (ip == null) {
  			ip = 'localhost'
  		}

      //topic_name
      let topic_name = "";
      if (args.TURTLEBOT_DRAWING == "描画する"){
        topic_name = String("/usb_cam/image_raw");
      }
      else if (args.TURTLEBOT_DRAWING == "色検出範囲がわかるように描画する"){
        topic_name = String("specified_range_drawing");
      }
      else if (args.TURTLEBOT_DRAWING == "消す"){
        topic_name = String("");
      }

  		this.viewer_.selectImageURL(ip, topic_name);
  	}

    subQrdistance (args) {
        return this.turtlebot_.isQrdistance;
    }

    subQrwidth (args) {
        return this.turtlebot_.isQrwidth;
    }

    subQrangle (args) {
        return this.turtlebot_.isQrangle;
    }

    subQrrecod (args) {
        return this.turtlebot_.isQrrecod;
    }

    subImageColor (args) {
        return this.turtlebot_.isImageCommonColor;
    }

    subImageR (args) {
        return this.turtlebot_.isImageRAve;
    }

    subImageG (args) {
        return this.turtlebot_.isImageGAve;
    }

    subImageB (args) {
        return this.turtlebot_.isImageBAve;
    }

    subRecognition_word (args) {
        return this.turtlebot_.isRecognitionWord;
    }

    pubSpeech (args) {
      this.turtlebot_.publishScratchRos("speech:"+String(args.WORD));
    }


    getInfo () {
        return {
            id: 'turtlebot',
            name: formatMessage({id: 'turtlebot.categoryName', default: 'TurtleBot'}),
            showStatusButton: true,
            menuIconURI: iconURI,
            blockIconURI: iconURI,
            colour: '#58ACFA',
            colourSecondary: '#2E9AFE',
            colourTertiary: '#0080FF',
            blocks: [
                {
                    opcode: 'setROSIP',
                    text: formatMessage({id: 'turtlebot.setROSIP', default: '[TURTLEBOT_NAME] に接続する'}),
                    blockType: BlockType.COMMAND,
                    arguments: { TURTLEBOT_NAME: {type:ArgumentType.STRING, menu:'TURTLEBOT_NAME', defaultValue:"TurtleBot"}}
                },
                {
                  opcode: 'closeROSIP',
                  text: formatMessage({id: 'turtlebot.closeROSIP', default: '[TURTLEBOT_NAME] を切断する'}),
                  blockType: BlockType.COMMAND,
                  arguments: { TURTLEBOT_NAME: {type:ArgumentType.STRING, menu:'TURTLEBOT_NAME', defaultValue:"TurtleBot"}}
                },
                {
                    opcode: 'stopMotion',
                    text: formatMessage({id: 'turtlebot.stopMotion', default: 'TurtleBotの動きを止める（距離指定時用）'}),
                    blockType: BlockType.COMMAND,
                    arguments: {}
                },
                {
                    opcode: 'pushBumper',
                    text: formatMessage({id: 'turtlebot.pushBumper', default: '[TURTLEBOT_BUMPER] のバンパーが押された時'}),
                    blockType: BlockType.HAT,
                    arguments: { TURTLEBOT_BUMPER: {type:ArgumentType.STRING, menu:'TURTLEBOT_BUMPER', defaultValue:"前方"}}
                },
                {
                    opcode: 'pushButton',
                    text: formatMessage({id: 'turtlebot.pushButton', default: '[TURTLEBOT_BUTTON] のボタンが押された時'}),
                    blockType: BlockType.HAT,
                    arguments: { TURTLEBOT_BUTTON: {type:ArgumentType.STRING, menu:'TURTLEBOT_BUTTON', defaultValue:"0"}}
                },
                {
                    opcode: 'pubLED',
                    text: formatMessage({id: 'turtlebot.pubLED', default: 'LEDを [TURTLEBOT_LED] にする'}),
                    blockType: BlockType.COMMAND,
                    arguments: { TURTLEBOT_LED: {type:ArgumentType.STRING, menu:'TURTLEBOT_LED', defaultValue:"消灯"}}
                },
                {
                    opcode: 'pubSound',
                    text: formatMessage({id: 'turtlebot.pubSound', default: '[TURTLEBOT_SOUND] のブザー'}),
                    blockType: BlockType.COMMAND,
                    arguments: { TURTLEBOT_SOUND: {type:ArgumentType.STRING, menu:'TURTLEBOT_SOUND', defaultValue:"スイッチON"}}
                },
                {
                    opcode: 'pubGo_straight',
                    text: formatMessage({id: 'turtlebot.pubGo_straight', default: 'お手本：[GO_STRAIGHT] cm 進む'}),
                    blockType: BlockType.COMMAND,
                    arguments: { GO_STRAIGHT:{type: ArgumentType.ANGLE, defaultValue:formatMessage({id:'turtlebot.turtlebot_go_straight',　default:'15'})}}
                },
                {
                    opcode: 'pubAngle',
                    text: formatMessage({id: 'turtlebot.pubAngle', default: 'お手本：[TURTLEBOT_ANGLE] に角度を指定'}),
                    blockType: BlockType.COMMAND,
                    arguments: { TURTLEBOT_ANGLE:{type: ArgumentType.ANGLE, defaultValue:formatMessage({id:'turtlebot.angle',　default:'90'})}}
                },
                {
                    opcode: 'pubCmdVel',
                    text: formatMessage({id: 'turtlebot.pubGo_straight_and_Angle', default: '前後 [VEL_VALUE]cm/秒 左右[RAD_VALUE]度/秒 で移動する'}),
                    blockType: BlockType.COMMAND,
                    arguments: {
                      VEL_VALUE:{type: ArgumentType.ANGLE, defaultValue:formatMessage({id:'turtlebot.pubCmdVel',　default:'15'})},
                      RAD_VALUE:{type: ArgumentType.ANGLE, defaultValue:formatMessage({id:'turtlebot.pubCmdVel',　default:'15'})}
                    }
                },
                {
                    opcode: 'pubMove_speed',
                    text: formatMessage({id: 'turtlebot.pubMove_speed', default: '[MOVING_SPEED] cm/sで移動する'}),
                    blockType: BlockType.COMMAND,
                    arguments: { MOVING_SPEED:{type: ArgumentType.ANGLE, defaultValue:formatMessage({id:'turtlebot.move_speed',　default:'15'})}}
                },
                {
                    opcode: 'pubRotation_speed',
                    text: formatMessage({id: 'turtlebot.pubRotation_speed', default: '[ROTATION_SPEED] deg/sで回転する'}),
                    blockType: BlockType.COMMAND,
                    arguments: { ROTATION_SPEED:{type: ArgumentType.ANGLE, defaultValue:formatMessage({id:'turtlebot.rotation_speed',　default:'90'})}}
                },
                {
                    opcode: 'pubOdome_Initialize',
                    text: formatMessage({id: 'turtlebot.pubOdome_Initialize', default: 'TurtleBotの位置と角度の記録を初期化'}),
                    blockType: BlockType.COMMAND,
                    arguments: {}
                },
                {
        					opcode: 'drawImage',
        					text: formatMessage({ id: 'newblocks.selectImage', default: 'カメラの映像を[TURTLEBOT_DRAWING]' }),
        					blockType: BlockType.COMMAND,
        					arguments: {TURTLEBOT_DRAWING:{type:ArgumentType.STRING, menu:'TURTLEBOT_DRAWING', defaultValue:"描画する"}}
				        },
                {
                    opcode: 'pubSpeech',
                    text: formatMessage({id: 'turtlebot.pubSpeech', default: '[WORD]と発話する'}),
                    blockType: BlockType.COMMAND,
                    arguments: {WORD:{type:ArgumentType.STRING,defaultValue:"こんにちは"}}
                },
                {
                    opcode: 'boolBumper',
                    text: formatMessage({id: 'turtlebot.boolBumper',　default: '[TURTLEBOT_BUMPER] のバンパーが押されている'}),
                    blockType: BlockType.BOOLEAN,
                    arguments: { TURTLEBOT_BUMPER:{type:ArgumentType.STRING, menu:'TURTLEBOT_BUMPER', defaultValue:"前方"}}
                },
                {
                    opcode: 'boolButton',
                    text: formatMessage({id: 'turtlebot.boolButton',　default: '[TURTLEBOT_BUTTON] のボタンが押されている'}),
                    blockType: BlockType.BOOLEAN,
                    arguments: {TURTLEBOT_BUTTON:{type:ArgumentType.STRING, menu:'TURTLEBOT_BUTTON', defaultValue:"0"}}
        				},
                {
                    opcode: 'subRobotPoseX',
                    text: formatMessage({id: 'turtlebot.subRobotPoseX',　default: 'TurtleBotの現在のx座標位置(m)'}),
                    blockType: BlockType.REPORTER,
                    arguments: {}
                },
                {
                    opcode: 'subRobotPoseY',
                    text: formatMessage({id: 'turtlebot.subRobotPoseY',　default: 'TurtleBotの現在のy座標位置(m)'}),
                    blockType: BlockType.REPORTER,
                    arguments: {}
                },
                {
                    opcode: 'subRobotAngle',
                    text: formatMessage({id: 'turtlebot.subRobotAngle',　default: 'TurtleBotの現在の角度(度)'}),
                    blockType: BlockType.REPORTER,
                    arguments: {}
                },
                {
                  opcode: 'subQrdistance',
                  text: formatMessage({ id: 'turtlebot.subQrdistance', default: 'カメラからQRコードまでの前後の距離(cm)' }),
                  blockType: BlockType.REPORTER,
                  arguments: {}
                },
                {
                  opcode: 'subQrwidth',
                  text: formatMessage({ id: 'turtlebot.subQrwidth', default: 'カメラからQRコードまでの左右の距離(cm)' }),
                  blockType: BlockType.REPORTER,
                  arguments: {}
                },
                {
                  opcode: 'subQrangle',
                  text: formatMessage({ id: 'turtlebot.subQrangle', default: 'カメラから見たQRコードの角度(度)' }),
                  blockType: BlockType.REPORTER,
                  arguments: {}
                },
                {
                  opcode: 'subImageColor',
                  text: formatMessage({ id: 'turtlebot.subImageColor', default: 'お手本：カメラ画像の枠内の色' }),
                  blockType: BlockType.REPORTER,
                  arguments: {}
                },
                {
                  opcode: 'subImageR',
                  text: formatMessage({ id: 'turtlebot.subImageR', default: 'redチャンネルの平均値' }),
                  blockType: BlockType.REPORTER,
                  arguments: {}
                },
                {
                  opcode: 'subImageG',
                  text: formatMessage({ id: 'turtlebot.subImageG', default: 'greenチャンネルの平均値(度)' }),
                  blockType: BlockType.REPORTER,
                  arguments: {}
                },
                {
                  opcode: 'subImageB',
                  text: formatMessage({ id: 'turtlebot.subImageB', default: 'blueチャンネルの平均値(度)' }),
                  blockType: BlockType.REPORTER,
                  arguments: {}
                },
                {
                  opcode: 'subQrrecod',
                  text: formatMessage({ id: 'turtlebot.subQrrecod', default: 'QRコードの言葉' }),
                  blockType: BlockType.REPORTER,
                  arguments: {}
                },
                {
                  opcode: 'subRecognition_word',
                  text: formatMessage({ id: 'turtlebot.subRecognition_word', default: '音声認識した言葉' }),
                  blockType: BlockType.REPORTER,
                  arguments: {}
        }
            ],
            menus: {
                TURTLEBOT_NAME: ["TurtleBot","TurtleBot_1","TurtleBot_2","TurtleBot_3","TurtleBot_4","TurtleBot_5","TurtleBot_6","TurtleBot_7","TurtleBot_8","TurtleBot_9","TurtleBot_10","TurtleBot_11","TurtleBot_test"],
                TURTLEBOT_LED: ["消灯","赤","黃","緑"],
                TURTLEBOT_SOUND: ["スイッチON","スイッチOFF","充電中","ボタン","エラー","休憩","驚き"],
                TURTLEBOT_BUMPER: ["前方","左","右"],
                TURTLEBOT_BUTTON: ["0","1","2"],
                TURTLEBOT_DRAWING: ["描画する","色検出範囲がわかるように描画する","消す"]
            }
        }
    }

}//Scratch3TurtleBotBlocks

module.exports = Scratch3TurtleBotBlocks;
