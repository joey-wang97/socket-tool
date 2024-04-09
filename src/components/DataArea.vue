<template>
  <div class="flex-column gap20 auto-height">
    <div class="flex-column gap10">
      <div class="flex-row-vertical-center gap20">
        <div class="label">发送区数据: </div>
        <div>
          <el-radio-group v-model="form.sendType">
            <el-radio value="string">文本</el-radio>
            <el-radio value="hex">十六进制</el-radio>
          </el-radio-group>
          <span class="placeholder" style="margin-left: 10px; font-size: 14px;">16进制用空格隔开: c3 a0 25</span>
        </div>
        <div>
          <el-button @click="send" color="blue">发送</el-button>
          <el-button @click="clear">清空</el-button>
        </div>
        <div class="flex-row-vertical-center gap10">
          <el-checkbox v-model="form.enableIntervalSend" @change="toogleIntervalSend"></el-checkbox>
          <div class="label">每隔 <el-input-number v-model="form.sendingInterval" :disabled="form.enableIntervalSend"
              style="width:100px" :controls="false" /> ms发送</div>
        </div>
      </div>
      <el-input v-model="form.data" :rows="3" type="textarea" />
    </div>
    <div class="flex-row-vertical-center gap20">
      <div class=" label">接收区数据:</div>
      <el-radio-group :modelValue="props.receiveType" @change="changeReceiveType">
        <el-radio value="string">文本</el-radio>
        <el-radio value="hex">十六进制</el-radio>
      </el-radio-group>
      <el-button @click="clearRecv">清空</el-button>
      <el-checkbox v-model="form.saveReceivedData" label="保存到文件" @change="toggleSave" />
      <el-input :value="form.savePath" disabled style="width:250px" />
      <el-button @click="openSaveFile">打开文件</el-button>
    </div>
    <div ref="recvAreaRef" class="auto-height recv-area thin-scrollbar">
      <div v-for="(msg, index) in messages" :key="index" class="msg-item">
        <span class="placeholder">{{ msg.time }}:</span> {{ msg.content }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch, nextTick } from "vue";
import path from "path";
import { ElMessage } from "element-plus";
import { formatNow, getCompactToday } from "@/util/commonUtil";
import { chooseDirectory, openPath } from "@/util/ipcUtil";
import { writeFile } from 'node:fs/promises';
import { clearInterval } from "timers";

const props = defineProps({
  receiveType: String,
  connected: Boolean,
  notConnectedMsg: {
    type: String,
    default: "请先建立连接"
  }
})
const emit = defineEmits(["send", "update:receiveType"]);
const recvAreaRef = ref();
let sendingTask;

const form = reactive({
  sendType: 'string',
  data: '',
  receiveType: 'string',
  saveReceivedData: false,
  savePath: '',
  sendingInterval: null
});
const messages = reactive([]);

const send = (showMsgBox = true) => {
  if (!props.connected) {
    ElMessage({
      message: props.notConnectedMsg,
      type: "warning",
    });
    return;
  }
  if (!form.data) {
    if (showMsgBox) {
      ElMessage({
        message: "请输入要发送的数据",
        type: "warning",
      });
    }
    return;
  }
  let data = form.data;
  if (form.sendType == "hex") {
    // 用空格分隔，以十六进制转成整数
    data = Buffer.from(form.data.split(" ").map(i => parseInt(i, 16)));
  }
  emit("send", data, showMsgBox);
};

const toggleSave = (save) => {
  console.debug(save);
  if (save) {
    chooseDirectory().then((p) => {
      if (!p) {
        ElMessage({
          message: "请选择保存路径",
          type: "warning",
        });
        form.saveReceivedData = false;
        return;
      };
      form.savePath = path.resolve(p, getCompactToday() + '.log');
    });
  }
}

const addMessage = async (data, scrollToEnd = true) => {
  let content = data;
  let time = formatNow();
  messages.push({
    content: content,
    time: time
  })
  if (form.saveReceivedData) {
    // https://nodejs.org/api/fs.html#fspromiseswritefilefile-data-options
    await writeFile(form.savePath, `${time}: ${content}\n`, { flag: 'a+' })
  }
  if (scrollToEnd) {
    // 等待元素渲染完成
    await nextTick();
    recvAreaRef.value.scrollTop = recvAreaRef.value.scrollHeight - recvAreaRef.value.clientHeight;
    console.log(recvAreaRef.value.scrollTop, recvAreaRef.value.scrollHeight);
  }
}

const changeReceiveType = (type) => {
  emit("update:receiveType", type);
}

const clear = () => {
  form.data = '';
}

const clearRecv = () => {
  messages.length = 0;
}

const openSaveFile = () => {
  if (!form.savePath) {
    ElMessage({
      message: "请选择保存路径",
      type: "warning",
    });
    return;
  }
  openPath(form.savePath);
}

const toogleIntervalSend = () => {
  // clear previous interval task
  if (sendingTask) {
    clearInterval(sendingTask);
    sendingTask = null;
  }

  if (!form.sendingInterval || !form.enableIntervalSend) {
    return;
  }
  // don't show warning
  sendingTask = setInterval(send, form.sendingInterval, false);
}
// 初始化函数后才能expose
defineExpose({ addMessage });

</script>

<style scoped>
.recv-area {
  /* height: 200px; */
  border: 1px solid #ccc;
  overflow: auto;
}

.msg-item{
  padding: 3px 0;
}
</style>