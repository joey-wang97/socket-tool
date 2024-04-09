<template>
  <div class="flex-row auto-height">
    <div class="form">
      <div>
        <div>设备:</div>
        <el-select v-model="form.serialPath" style="width:140px" @visible-change="refreshSerialPort">
          <el-option v-for="item in avaiableSerialPorts.data" :key="item.path" :label="item.path" :value="item.path" />
        </el-select>
      </div>
      <div>
        <div>波特率:</div>
        <el-select v-model="form.baudRate" style="width:140px">
          <el-option v-for="item in baudRateOptions" :key="item" :label="item" :value="item" />
        </el-select>
      </div>
      <el-button @click="connectBtnStatus.onClick" :color="connectBtnStatus.color">{{ connectBtnStatus.text
        }}</el-button>
    </div>
    <data-area ref="dataAreaRef" class="data-area" @send="send" v-model:receiveType="form.receiveType"
      :connected="serialPortConnected" />
  </div>
</template>

<script setup>
import { reactive, ref, computed } from "vue";
import { ElMessage } from "element-plus";
import { SerialPort } from 'serialport'
import DataArea from "@/components/DataArea.vue";
import { buffer2HexString } from "@/util/commonUtil";

const form = reactive({ serialPath: "", baudRate: 115200, receiveType: 'string' });
// 串口是否已连接
const serialPortConnected = ref(false);
// 所有可用串口
const avaiableSerialPorts = reactive({ data: [] });
const baudRateOptions = reactive([4800, 9600, 14400, 19200, 38400, 56000, 57600, 115200, 128000, 256000, 460800, 512000, 750000, 921600, 1500000]);
// 与串口建立的连接
let serialPortConnection = null;
const dataAreaRef = ref();

const connectBtnStatus = computed(() => {
  if (serialPortConnected.value) {
    return {
      onClick: disconnect,
      text: '断开',
      color: 'red'
    }
  }
  return {
    onClick: connect,
    text: '连接',
    color: 'green'
  }
})

const connect = () => {
  if (!form.serialPath) {
    ElMessage({
      message: "请选择一个设备",
      type: "warning",
    });
    return;
  }
  serialPortConnection = new SerialPort({
    // The system path of the serial port you want to open. For example, `/dev/tty.XXX` on Mac/Linux, or `COM1` on Windows
    path: form.serialPath,
    baudRate: form.baudRate,
    // //Must be one of these: 5, 6, 7, or 8 defaults to 8
    // dataBits: 8
    // //Prevent other processes from opening the port. Windows does not currently support `false`. Defaults to true
    // lock
    // //Must be 1, 1.5 or 2 defaults to 1
    // stopBits
    // parity
    // binding:
    // //Flow control Setting. Defaults to false
    // rtscts
    // //Flow control Setting. Defaults to false
    // xon
    // //Flow control Setting. Defaults to false
    // xoff
    // //Flow control Setting. Defaults to false
    // xany
    // //drop DTR on close. Defaults to true
    // hupcl
    // autoOpen: true,
    // //The size of the read and write buffers defaults to 64k
    // highWaterMark: 128 * 1024,
    // //Emit 'end' on port close defaults false
    // endOnClose: true
  });

  // The open event is always emitted
  serialPortConnection.on('open', function () {
    serialPortConnected.value = true;
    console.log('serial port opened');
    // open logic
  })

  serialPortConnection.on('close', function () {
    ElMessage({
      message: "串口已关闭",
      type: "warning",
    });
    serialPortConnected.value = false;
    console.log('serial port closed');
    // open logic
  })

  // serialPortConnection.on('readable', function () {
  //   console.log('readable');
  //   let data = serialPortConnection.read();
  //   console.log(data);
  //   if (data instanceof Buffer && form.receiveType == 'hex') {
  //     data = buffer2HexString(data);
  //   }
  //   addMessage(data);
  // })

  serialPortConnection.on('data', function (data) {
    console.log('serial port received', data);
    if (data instanceof Buffer && form.receiveType == 'hex') {
      data = buffer2HexString(data);
    }
    addMessage(data);
  })

  // Open errors will be emitted as an error event
  serialPortConnection.on("error", function (err) {
    console.log("Connect Serial Port Error: ", err);
    ElMessage({
      message: "Error:" + err.message,
      type: "error",
    });
    serialPortConnected.value = false;
  });
};

const disconnect = () => {
  if (serialPortConnection == null) return;
  console.log(serialPortConnection);
  serialPortConnection.close();
}

const send = (data, showMsgBox = false) => {
  if (serialPortConnection == null || serialPortConnected.value == false) {
    ElMessage({
      message: "please open serial port first",
      type: "warning",
    });
    return;
  }
  serialPortConnection.write(data, function (err) {
    if (err) {
      console.error("Error on write: ", err);
      ElMessage({
        message: "write error:" + err.message,
        type: "error",
      });
    }
  });
  if (showMsgBox) {
    ElMessage({
      message: "send data success",
      type: "success",
    });
  }
};

const addMessage = (data) => {
  dataAreaRef.value.addMessage(data);
}

const refreshSerialPort = async () => {
  avaiableSerialPorts.data = await SerialPort.list();
  console.log('refresh port list')
}

// 刷新串口列表
refreshSerialPort();
</script>

<style lang="less" scoped>
.form {
  width: 210px;
  padding-right: 8px;
  border-right: 1px solid #ccc;
  text-align: center;

  >div {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    >div {
      flex-shrink: 0;
    }
  }
}

.data-area {
  flex-grow: 1;
  margin-left: 8px
}
</style>
