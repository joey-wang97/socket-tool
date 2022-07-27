<template>
  <div>
    <el-form :model="form">
      <el-form-item label="server ip">
        <el-input v-model="form.serverIp" />
      </el-form-item>
      <el-form-item label="server port">
        <el-input v-model="form.serverPort" />
      </el-form-item>
      <el-form-item label="local port">
        <el-input v-model="form.localPort" />
      </el-form-item>
      <el-form-item label="connect type">
        <el-input v-model="form.connectType" />
      </el-form-item>
      <el-form-item label="data to send">
        <el-input v-model="form.data" />
      </el-form-item>
      <el-form-item>
        <el-button @click="connect" color="green">Connect</el-button>
        <el-button @click="send" color="blue">Send</el-button>
      </el-form-item>
    </el-form>
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
import net from "net";
import { ElMessage } from "element-plus";

const form = reactive({ serverIp: "localhost", serverPort: 8080 });
const messages = ref("");
let client = null;

const connect = () => {
  client = net.connect(parseInt(form.serverPort), form.serverIp, () => {
    ElMessage({
      message: "connect success",
      type: "success",
    });
    messages.value =
      messages.value + `connect to ${form.serverIp}:${form.serverPort} success`;
  });
  client.on("data", (data) => {
    console.log("on data", data);
    messages.value = messages.value + `\n${data}`;
  });
  client.on("end", () => {
    console.log("disconnected from server");
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
  client.write(form.data);
  ElMessage({
    message: "send data success",
    type: "success",
  });
};

</script>

<style>
</style>
