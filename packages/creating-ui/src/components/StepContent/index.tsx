import React from 'react';
import { map } from 'lodash';
import { Icon, Button } from '@alicloud/console-components';
import { Request } from '../../constants';
import '../../index.less';

type Props = {
  tasks: Request[];
  isSuspend?: boolean;
  currentTask: Request;
  onRetry: () => void;
  onResume: () => void;
  showRetry: boolean;
  isChild?: boolean;
};

const StepContent = (props: Props) => {
  const {
    tasks = [],
    currentTask = {} as any,
    isSuspend,
    onRetry,
    onResume,
    showRetry,
    isChild = false,
  } = props;
  return (
    <>
      {map(tasks, (task) => {
        if (task.runStatus === 'finish')
          return (
            <div className={isChild ? 'color-success' : ''}> {task.successMsg || task.title} </div>
          );
        if (task.runStatus === 'pending')
          return (
            <div>
              {task.title}
              <span className="ml-8 cursor-pointer color-primary" onClick={onResume}>
                继续执行
              </span>
            </div>
          );
        if (currentTask.key === task.key) {
          return (
            <>
              {isSuspend ? (
                <div>
                  <span className="color-error">{task.errorMsg}</span>
                  {showRetry && (
                    <Icon
                      className="ml-8 cursor-pointer"
                      type="refresh"
                      size="xs"
                      onClick={onRetry}
                    />
                  )}
                </div>
              ) : (
                <div> {task.runningMsg || task.title} </div>
              )}
            </>
          );
        }
        return <div>{task.title}</div>;
      })}
    </>
  );
};

export default StepContent;
