<template>
  <div>
    <div class="flex-row-vertical-center gap20">
      <div class="label">目标地址:</div>
      <el-input v-model="form.targetAddress" style="width:200px" />
      <div class="label">目标端口:</div>
      <el-input-number v-model="form.targetPort" :min="0" :max="65535" />
    </div>
    <div class="flex-row-vertical-center gap20" style="margin: 20px 0">
      <div class=" label">本地地址</div>
      <el-select v-model="form.localAddress">
        <el-option v-for="item in ipOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <div class="label">本地端口:</div>
      <el-input-number v-model="form.localPort" :min="0" :max="65535" />
      <el-button @click="createBtnStatus.onClick" :color="createBtnStatus.color">{{ createBtnStatus.text }}</el-button>
    </div>
    <div>
      <data-area ref="dataAreaRef" @send="send" v-model:receiveType="form.receiveType" :connected="udpListening" />
    </div>
    <!-- <el-form :model="form">
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
    <el-input v-model="messages" :rows="15" type="textarea" placeholder="messages" /> -->
  </div>
</template>

<script setup>
import { reactive, ref, computed } from "vue";
import net from "net";
import dgram from "node:dgram";
import { ElMessage } from "element-plus";
import DataArea from "@/components/DataArea.vue";
import { listAllLocalIp } from "@/util/commonUtil";

// 获取本机所有ip
const ipOptions = ['0.0.0.0'].concat(listAllLocalIp()).map(ip => {
  return {
    label: ip,
    value: ip
  }
});

const createBtnStatus = computed(() => {
  if (udpListening.value) {
    return {
      onClick: close,
      text: '断开',
      color: 'red'
    }
  }
  return {
    onClick: create,
    text: '创建',
    color: 'green'
  }
})

const form = reactive({
  localAddress: "127.0.0.1", localPort: 6000,
  targetAddress: "127.0.0.1", targetPort: 1024,
  receiveType: 'string'
});
const messages = ref("");
const udpListening = ref(false);
// udp connect
let server = null;

const dataAreaRef = ref();

const create = () => {
  server = dgram.createSocket({ type: "udp4" });
  server.on("message", (data, rinfo) => {
    console.log(data, rinfo);
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
    addMessage(`receive data from ${rinfo.address}: ${rinfo.port}`);
    addMessage(data);
  });
  server.on("close", () => {
    udpListening.value = false;
    addMessage(`UDP已关闭`);
  });
  server.on("error", (e) => {
    console.error('udp error', e);
    addMessage(`Error: ${e}`);
  });
  server.on("connect", () => {
    addMessage(`已连接`);
  });
  server.on("listening", (e) => {
    udpListening.value = true;
    ElMessage({
      message: "create success",
      type: "success",
    });
    addMessage(`UDP创建成功, 正在监听:${form.localPort}`);
  });
  server.bind(form.localPort, form.localAddress, () => {

  });

};

const close = () => {
  if (server == null) {
    return;
  }
  // server.disconnect();
  server.close();
};


const send = (data, showMsgBox) => {
  if (server == null) {
    ElMessage({
      message: "please create server first",
      type: "warning",
    });
    return;
  }
  server.send(data, form.targetPort, form.targetAddress, () => {
    if (showMsgBox) {
      ElMessage({
        message: "send data success",
        type: "success",
      });
    }
    addMessage("发送成功");
  });
};

const addMessage = async (data) => {
  await dataAreaRef.value.addMessage(data);
}
</script>

<style></style>
