<template>
  <div>
    <div class="flex-row gap20" style="margin: 0 10px;">
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
    <div class="margin10 flex-column gap10">
      <div class="flex-row gap20">
        <div class="label">发送区数据: </div>
        <div>
          <el-radio-group v-model="form.sendType">
            <el-radio label="string">文本</el-radio>
            <el-radio label="hex">十六进制</el-radio>
          </el-radio-group>
          <span class="placeholder" style="margin-left: 10px; font-size: 14px;">16进制用空格隔开: c3 a0 25</span>
        </div>
        <div>
          <el-button @click="send" color="blue">发送</el-button>
          <el-button @click="clear">清空</el-button>
        </div>
      </div>
      <el-input v-model="form.data" :rows="3" type="textarea" />
    </div>
    <div class="margin10 flex-row gap20">
      <div class=" label">接收区数据:</div>
      <el-radio-group v-model="form.receiveType">
        <el-radio label="string">文本</el-radio>
        <el-radio label="hex">十六进制</el-radio>
      </el-radio-group>
      <el-button @click="clearRecv">清空</el-button>

    </div>
    <div class="margin10 recv-area">
      <div v-for="(msg, index) in messages" :key="index">
        <span class="placeholder">{{ msg.time }}:</span> {{ msg.content }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from "vue";
import net from "net";
import { ElMessage } from "element-plus";
import { formatNow } from "@/util/commonUtil";

const form = reactive({
  serverIp: "localhost",
  serverPort: 8080,
  localPort: 0,
  sendType: 'string',
  data: '',
  receiveType: 'string'
});
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
    console.error(e);
    ElMessage({
      message: "连接失败:" + e,
      type: "error",
    });
    addMessage(`connect to ${form.serverIp}:${form.serverPort} error`);
  });

  socket.on("data", (data) => {
    console.log("on data", data);
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
    console.log("disconnected from server");
    socketConnected.value = false;
  });
};

const disconnect = () => {
  socketConnected.value = false;
  addMessage(`连接已断开`);
  if (socket == null) return;
  socket.end();
};

const send = () => {
  if (socket == null) {
    ElMessage({
      message: "请先连接服务",
      type: "warning",
    });
    return;
  }
  if (!form.data) {
    ElMessage({
      message: "请输入要发送的数据",
      type: "warning",
    });
    return;
  }
  let data = form.data;
  if (form.sendType == "hex") {
    // 用空格分隔，以十六进制转成整数
    data = Buffer.from(form.data.split(" ").map(i=>parseInt(i, 16)));
  }
  socket.write(data);
  ElMessage({
    message: "发送成功",
    type: "success",
  });
};

const addMessage = (data) => {
  let content = data;
  messages.push({
    content: content,
    time: formatNow()
  })
}

const clear = () => {
  from.data = '';
}

const clearRecv = () => {
  messages.length = 0;
}

</script>

<style lang="less">
.recv-area {
  height: 200px;
  border: 1px solid #ccc;
}
</style>
