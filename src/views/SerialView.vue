<template>
  <div>
    <el-input
      v-model="messages"
      :rows="15"
      type="textarea"
      placeholder="messages"
    />
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { SerialPort } from "serialport";
import { ElMessage } from "element-plus";

const form = reactive({ path: "/dev/tty-usbserial1", baudRate: 57600 });
const messages = ref("");
let port = null;

const connect = () => {
  port = new SerialPort({
    path: form.path,
    baudRate: form.baudRate,
  });

  // Open errors will be emitted as an error event
  port.on("error", function (err) {
    console.log("Error: ", err.message);
  });
};

const send = () => {
  if (client == null) {
    ElMessage({
      message: "please connect server first",
      type: "warning",
    });
    return;
  }
  if (!form.data) {
    ElMessage({
      message: "please input some content to send",
      type: "warning",
    });
    return;
  }
  port.write("main screen turn on", function (err) {
    if (err) {
      return console.log("Error on write: ", err.message);
    }
    console.log("message written");
  });
  ElMessage({
    message: "send data success",
    type: "success",
  });
};
</script>

<style>
</style>
