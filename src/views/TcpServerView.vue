<template>
  <div>
    <el-form :model="form">
      <el-form-item label="server port">
        <el-input v-model="form.serverPort" />
      </el-form-item>
      <el-form-item label="data to send">
        <el-input v-model="form.data" />
      </el-form-item>
      <el-form-item>
        <el-button @click="startServer" color="green">Start</el-button>
      </el-form-item>
    </el-form>
    <div></div>
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
let server = null;
// 客户端列表
let clients = [];

const startServer = () => {
  server = net.createServer((connection) => {
    ElMessage({
      message: "new client",
      type: "success",
    });
    addMessage({ content: "new client" });
  });
  server.on("error", (err) => {
    throw err;
  });
  server.listen(form.serverPort, () => {
    ElMessage({
      message: "server started",
      type: "success",
    });
    addMessage("server bound");
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

const addMessage = ({ content, type }) => {
  console.debug(content);
  // messages.value = messages.value + content;
};
</script>

<style>
</style>
