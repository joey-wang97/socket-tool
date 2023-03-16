<template>
  <div>
    <div class="flex-row gap20 margin10">
      <div class="label">服务端地址:</div>
      <el-input v-model="form.serverIp" style="width:200px" />
      <div class="label">端口:</div>

      <el-input-number v-model="form.serverPort" :min="0" :max="65535" />
    </div>
    <div class="flex-row gap20 margin10">
      <div class="label">本地端口:</div>
      <el-input-number v-model="form.localPort" :min="0" :max="65535" />
      <span class="placeholder">0代表随机</span>
      <el-button @click="connectBtnStatus.onClick" :color="connectBtnStatus.color">{{ connectBtnStatus.text }}</el-button>
    </div>
    <div class="margin20 flex-column gap10">
      <div class="label">发送区数据:</div>
      <el-input v-model="form.data" :rows="5" type="textarea" />
    </div>
    <div class="margin20 flex-row-between">
      <div class="flex-row gap20">
        <div class="label">数据类型: </div>
        <div>
          <el-radio-group v-model="form.dataType">
            <el-radio label="string">string</el-radio>
            <el-radio label="hex">Hex</el-radio>
          </el-radio-group>
        </div>
      </div>
      <div>
        <el-button @click="send" color="blue">发送</el-button>
        <el-button @click="clear">清空</el-button>
      </div>
    </div>
    <div>接收区数据</div>
    <el-input :value="11" :rows="15" type="textarea" placeholder="messages" />
  </div>
</template>

<script setup>
import { reactive, ref, computed } from "vue";
import net from "net";
import { ElMessage } from "element-plus";

const form = reactive({ serverIp: "localhost", serverPort: 6000, localPort: 0, dataType: 'string' });
const messages = reactive([]);
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
    text: '启动',
    color: 'green'
  }
})

const connect = () => {
  console.log('connect');
  socket = net.connect(parseInt(form.serverPort), form.serverIp);
  socket.on('connect', () => {
    ElMessage({
      message: "connect success",
      type: "success",
    });
    socketConnected.value = true;
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
    socketConnected.value = false;
  });
};

const disconnect = () => {
  socketConnected.value = false;
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

const clear = () => {
  messages.length = 0;
}

</script>

<style></style>
