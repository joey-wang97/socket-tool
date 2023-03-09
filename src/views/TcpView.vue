<template>
  <div>
    <el-form :model="form">
      <el-row>
        <el-form-item label="服务端地址">
          <el-input v-model="form.serverIp" />
        </el-form-item>
        <el-form-item label="端口">
          <el-input-number v-model="form.serverPort" :min="0" :max="65535" />
        </el-form-item>
      </el-row>
      <el-form-item label="本地端口">
        <el-input-number v-model="form.localPort" :min="0" :max="65535" />
      </el-form-item>
      <el-form-item label="发送区数据">
        <el-input v-model="form.data" />
      </el-form-item>
      <el-form-item label="数据类型">
        <el-radio-group v-model="form.dataType">
          <el-radio label="string">string</el-radio>
          <el-radio label="hex">Hex</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item>
        <el-button @click="connect" color="green">Connect</el-button>
        <el-button @click="disconnect">Disconnect</el-button>
        <el-button @click="send" color="blue">Send</el-button>
      </el-form-item>
    </el-form>
    <div>接收区数据</div>
    <el-input v-model="messages" :rows="15" type="textarea" placeholder="messages" />
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import net from "net";
import { ElMessage } from "element-plus";

const form = reactive({ serverIp: "localhost", serverPort: 6000 });
const messages = ref("");
let socket = null;

const connect = () => {
  socket = net.connect(parseInt(form.serverPort), form.serverIp);
  socket.on('connect', () => {
    ElMessage({
      message: "connect success",
      type: "success",
    });
    messages.value =
      messages.value + `connect to ${form.serverIp}:${form.serverPort} success`;
  });
  socket.on('error', (e) => {
    console.error(e);
    ElMessage({
      message: "连接失败:" + e,
      type: "error",
    });
  });

  socket.on("data", (data) => {
    // console.log("on data", data);
    messages.value = messages.value + `\n${data}`;
  });
  socket.on("end", () => {
    console.log("disconnected from server");
  });
};

const disconnect = () => {
  if (socket == null) return;
  socket.end();
};

const send = () => {
  if (socket == null) {
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
  let data = form.data;
  if (form.dataType == "hex") {
    data = Buffer.from(form.data);
  }
  socket.write(data);
  ElMessage({
    message: "send data success",
    type: "success",
  });
};

</script>

<style>
</style>
