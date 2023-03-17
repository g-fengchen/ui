import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Message } from '@alicloud/console-components';
import StepTask from './components/StepTask';
import { Props, Request } from './constants/index';
import { find, isEmpty, map, set, cloneDeep, noop } from 'lodash';

const CreatingUi = (props: Props, ref) => {
  const {
    dataSource,
    onError = noop,
    onComplete = noop,
    countdown = 0,
    onCountdownComplete = noop,
    showRetry = true,
    retryType = 'current',
    help = '',
  } = props;
  const [stepList, setStepList] = useState([]);
  const [isSuspend, setIsSuspend] = useState(false);
  const [taskContents, setTaskContents] = useState({});

  const [count, setCount] = useState(countdown);
  let intervalCount = useRef(count);
  let interval = useRef(null);
  let taskStopKey = useRef(null);

  useImperativeHandle(ref, () => ({
    onRetry,
  }));

  useEffect(() => {
    onInit();
    return () => {
      clearInterval(interval.current);
    };
  }, []);

  const save = async (values, params = {}) => {
    const found = find(values, { runStatus: 'wait' });
    const foundPending = find(values, { runStatus: 'pending' });
    if (!isEmpty(found) && isEmpty(foundPending)) {
      const task = find(found.tasks, { runStatus: 'wait' });
      const taskPending = find(found.tasks, { runStatus: 'pending' });
      if (!isEmpty(taskPending)) {
        console.log(taskPending, 'taskPending');
      } else {
        try {
          const content: any = await onRunTask(!isEmpty(task) ? task : found, params);
          setStepList([...values]);
          setTaskContents(content);
          await save([...values], content);
        } catch (content) {
          setIsSuspend(true);
          setTaskContents(content);
          onError && onError(content);
        }
      }
    } else if (!isEmpty(foundPending)) {
      console.log(111, '111');
    } else {
      onComplete && onComplete(params);
      intervalCount.current && onCountdown();
    }
  };

  const onInit = () => {
    const newData = map(dataSource, (item: Request, index) => ({
      ...item,
      index,
      runStatus: item.runStatus || 'wait',
      tasks: initTasks(item.tasks),
    }));
    setStepList(newData);
    save(newData, {});
  };

  // 执行倒计时逻辑
  const onCountdown = () => {
    interval.current = setInterval(() => {
      if (intervalCount.current >= 1) {
        intervalCount.current = intervalCount.current - 1;
        setCount(intervalCount.current);
      } else {
        onCountdownComplete && onCountdownComplete();
        clearInterval(interval.current);
      }
    }, 1000);
  };

  // 重试事件
  const onRetry = () => {
    setIsSuspend(false);
    retryType === 'all' ? onInit() : save(stepList, taskContents);
  };

  // 继续执行事件
  const onResume = () => {
    const staskList = cloneDeep(stepList);
    const currentParent = find(staskList, { runStatus: 'wait' });
    const pendingParent = find(staskList, { runStatus: 'pending' });

    const pendingTask = find(currentParent?.tasks, { runStatus: 'pending' });
    if (!isEmpty(pendingParent)) {
      pendingParent.runStatus = 'wait';
    } else if (!isEmpty(pendingTask)) {
      pendingTask.runStatus = 'wait';
    }
    setStepList([...staskList]);
    save(staskList, taskContents);
  };

  const onRunTask = async (task, content) => {
    const onTaskStop = onStopped(task);

    return new Promise(async (resolve, reject) => {
      const newContent = cloneDeep(content);
      try {
        if (task.run) {
          const result = await task?.run({ content: newContent, onTaskStop });
          set(newContent, task.key, { result, success: true });
        }
        if (taskStopKey.current === task.key) {
          task.runStatus = 'pending';
        } else {
          task.runStatus = 'finish';
        }
        resolve(newContent);
      } catch (error) {
        set(newContent, task.key, { result: error, success: false });
        reject(newContent);
      }
    });
  };

  const initTasks = (value = []) => {
    if (isEmpty(value)) return [];
    return map(value, (item: Request) => ({ ...item, runStatus: item.runStatus || 'wait' }));
  };

  const onStopped = (task) => {
    return () => {
      taskStopKey.current = task.key;
    };
  };

  return (
    <div className="application-container" style={{ width: 600 }}>
      <Message type="warning" className="mt-5">
        <>
          <div className="text-middle">当前阶段请不要刷新页面</div>
          {help}
        </>
      </Message>
      <StepTask
        stepList={stepList}
        isSuspend={isSuspend}
        count={count}
        onRetry={onRetry}
        onResume={onResume}
        showRetry={showRetry}
      />
    </div>
  );
};
export default forwardRef(CreatingUi);
