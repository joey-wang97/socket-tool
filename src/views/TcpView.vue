<template>
  <div>
    <div class="flex-row-vertical-center gap20">
      <div class="label">服务端地址:</div>
      <el-input v-model="form.serverIp" style="width:200px" />
      <div class="label">端口:</div>

      <el-input-number v-model="form.serverPort" :min="0" :max="65535" />
    </div>
    <div class="flex-row-vertical-center gap20" style="margin: 20px 0">
      <div class="label">本地端口:</div>
      <el-input-number v-model="form.localPort" :min="0" :max="65535" />
      <span class="placeholder">0代表随机</span>
      <el-button @click="connectBtnStatus.onClick" :color="connectBtnStatus.color">{{ connectBtnStatus.text }}</el-button>
    </div>
    <div>
      <data-area ref="dataAreaRef" @send="send" v-model:receiveType="form.receiveType" />
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from "vue";
import net from "net";
import { ElMessage } from "element-plus";
import DataArea from "@/components/DataArea.vue";

const form = reactive({
  serverIp: "localhost",
  serverPort: 8020,
  localPort: 0,
  receiveType: 'string'
});

const dataAreaRef = ref();
const socketConnected = ref(false);
let socket;


const connectBtnStatus = computed(() => {
  if (socketConnected.value) {
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
  console.log('connect');
  socket = net.connect(parseInt(form.serverPort), form.serverIp);
  // 设置编码为16进制，让data回调为buffer类型
  // socket.setEncoding('hex');
  socket.on('connect', () => {
    ElMessage({
      message: "连接成功",
      type: "success",
    });
    socketConnected.value = true;
    addMessage(`connect to ${form.serverIp}:${form.serverPort} success`);
  });
  socket.on('error', (e) => {
    console.error('tcp client error', e);
    ElMessage({
      message: "连接错误:" + e,
      type: "error",
    });
    socketConnected.value = false;
    addMessage(`connect to ${form.serverIp}:${form.serverPort} error: ${e}`);
  });

  socket.on("data", (data) => {
    console.debug('on data', data);
    if (data instanceof Buffer && form.receiveType == 'hex') {
      data = data.toString('hex');
      let t = "";
      let i = 0;
      // 每隔两个字符插空格
      while (i < data.length) {
        t += data[i];
        t += data[i + 1];
        i = i + 2;
        t += " ";
      }
      data = t;
    }
    addMessage(data);
  });
  socket.on("end", () => {
    console.debug("disconnected from server");
    socketConnected.value = false;
  });
};

const disconnect = () => {
  socketConnected.value = false;
  addMessage(`连接已断开`);
  if (socket == null) return;
  socket.end();
};

const send = (data) => {
  if (socket == null || !socketConnected.value) {
    ElMessage({
      message: "请先连接服务",
      type: "warning",
    });
    return;
  }
  socket.write(data);
  ElMessage({
    message: "发送成功",
    type: "success",
  });
  // addMessage('发送成功');
};


const addMessage = async (data) => {
  await dataAreaRef.value.addMessage(data);
}
</script>

<style lang="less"></style>
