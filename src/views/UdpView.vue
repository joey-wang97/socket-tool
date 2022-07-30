<template>
  <div>
    <el-form :model="form">
      <el-form-item label="local port">
        <el-input v-model="form.localPort" />
      </el-form-item>
      <el-form-item label="address">
        <el-input v-model="form.address" />
      </el-form-item>
      <el-form-item label="target address">
        <el-input v-model="form.targetAddress" />
      </el-form-item>
      <el-form-item label="target port">
        <el-input v-model="form.targetPort" />
      </el-form-item>

      <el-form-item label="data to send">
        <el-input v-model="form.data" />
      </el-form-item>
      <el-form-item>
        <el-button @click="create" color="green">Create</el-button>
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
import dgram from "node:dgram";
import { ElMessage } from "element-plus";

const form = reactive({ serverIp: "localhost", serverPort: 6000 });
const messages = ref("");
// udp connect
let server = null;

const create = () => {
  server = dgram.createSocket({ type: "udp4" });
  server.on("message", (msg, rinfo) => {
    console.log(msg, rinfo);
  });
  server.bind(form.localPort, form.address, () => {
    ElMessage({
      message: "create success",
      type: "success",
    });
  });
};

const send = () => {
  if (server == null) {
    ElMessage({
      message: "please create server first",
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
  const buffer = Buffer.from(form.data);
  server.send(form.data, form.targetPort, form.targetAddress, () => {
    ElMessage({
      message: "send data success",
      type: "success",
    });
  });
};
</script>

<style>
</style>
