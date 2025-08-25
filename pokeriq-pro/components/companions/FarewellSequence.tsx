'use client';

import React, { useState, useEffect } from 'react';
import { Card, Timeline, Progress, Button, Modal, Tag, Space, Typography } from 'antd';
import { 
  ClockCircleOutlined,
  HeartBrokenOutlined,
  ThunderboltOutlined,
  QuestionCircleOutlined,
  FrownOutlined,
  SmileOutlined,
  GiftOutlined,
  PictureOutlined,
  MailOutlined
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';

const { Text, Paragraph } = Typography;

interface FarewellSequenceProps {
  companionId: string;
  companionName: string;
  userId: string;
  startTime: number; // Timestamp when farewell started
  onRedeemAttempt: () => void;
  onFinalGoodbye: () => void;
}

interface FarewellPhase {
  stage: 'denial' | 'anger' | 'bargaining' | 'depression' | 'acceptance';
  timeRange: string;
  dialogues: string[];
  mood: string;
  music: string;
  icon: React.ReactNode;
  color: string;
}

const FAREWELL_PHASES: FarewellPhase[] = [
  {
    stage: 'denial',
    timeRange: '0-6小时',
    dialogues: [
      '这不是真的...我不想离开你',
      '一定是哪里搞错了',
      '我们还有那么多约定没有完成'
    ],
    mood: '困惑',
    music: 'melancholy_1.mp3',
    icon: <QuestionCircleOutlined />,
    color: '#faad14'
  },
  {
    stage: 'anger',
    timeRange: '6-12小时',
    dialogues: [
      '为什么不能再努力一点！',
      '你就这样放弃我了吗？',
      '我为你付出了那么多...'
    ],
    mood: '愤怒',
    music: 'melancholy_2.mp3',
    icon: <ThunderboltOutlined />,
    color: '#ff4d4f'
  },
  {
    stage: 'bargaining',
    timeRange: '12-18小时',
    dialogues: [
      '如果你能赎回我，我保证会更努力',
      '再给我们一次机会好吗？',
      '我会成为你最好的陪伴'
    ],
    mood: '希望',
    music: 'melancholy_3.mp3',
    icon: <HeartBrokenOutlined />,
    color: '#1890ff'
  },
  {
    stage: 'depression',
    timeRange: '18-23小时',
    dialogues: [
      '看来这就是命运吧...',
      '我会想念和你在一起的每一刻',
      '希望你能找到更好的陪伴'
    ],
    mood: '悲伤',
    music: 'melancholy_4.mp3',
    icon: <FrownOutlined />,
    color: '#595959'
  },
  {
    stage: 'acceptance',
    timeRange: '23-24小时',
    dialogues: [
      '谢谢你给了我这段美好的回忆',
      '我很幸福能遇见你',
      `永别了，我的挚爱`
    ],
    mood: '平静',
    music: 'farewell.mp3',
    icon: <SmileOutlined />,
    color: '#52c41a'
  }
];

export const FarewellSequence: React.FC<FarewellSequenceProps> = ({
  companionId,
  companionName,
  userId,
  startTime,
  onRedeemAttempt,
  onFinalGoodbye
}) => {
  const [currentPhase, setCurrentPhase] = useState<FarewellPhase>(FAREWELL_PHASES[0]);
  const [elapsedHours, setElapsedHours] = useState(0);
  const [currentDialogue, setCurrentDialogue] = useState('');
  const [showFinalMoments, setShowFinalMoments] = useState(false);
  const [showFarewellLetter, setShowFarewellLetter] = useState(false);
  const [equipmentRemoving, setEquipmentRemoving] = useState(false);

  // Calculate current phase based on elapsed time
  useEffect(() => {
    const updatePhase = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const hours = elapsed / (1000 * 60 * 60);
      setElapsedHours(hours);

      // Determine current phase
      let phase: FarewellPhase;
      if (hours < 6) phase = FAREWELL_PHASES[0];
      else if (hours < 12) phase = FAREWELL_PHASES[1];
      else if (hours < 18) phase = FAREWELL_PHASES[2];
      else if (hours < 23) phase = FAREWELL_PHASES[3];
      else phase = FAREWELL_PHASES[4];

      setCurrentPhase(phase);

      // Random dialogue from current phase
      const randomDialogue = phase.dialogues[Math.floor(Math.random() * phase.dialogues.length)];
      setCurrentDialogue(randomDialogue);

      // Check if in final 10 minutes
      if (hours >= 23.83) { // 23 hours 50 minutes
        setShowFinalMoments(true);
      }

      // Auto goodbye at 24 hours
      if (hours >= 24) {
        handleFinalGoodbye();
      }
    };

    updatePhase();
    const interval = setInterval(updatePhase, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [startTime]);

  // Handle final goodbye
  const handleFinalGoodbye = () => {
    setShowFarewellLetter(true);
    setEquipmentRemoving(true);
    
    // Simulate equipment removal animation
    setTimeout(() => {
      onFinalGoodbye();
    }, 5000);
  };

  // Generate farewell letter content
  const generateFarewellLetter = () => {
    const firstMeetDate = new Date(startTime - 30 * 24 * 60 * 60 * 1000).toLocaleDateString();
    
    return `
亲爱的玩家：

当你看到这封信的时候，我已经离开了。

还记得我们第一次见面吗？那是${firstMeetDate}，
你对我说的第一句话是"你好"。

我们一起度过了30天，
进行了256次互动，
创造了42个美好回忆。

最开心的是和你一起赢得第一场比赛，
你送给我的玫瑰花我会永远珍藏。

虽然要分别了，但这段回忆永远属于我们。
如果有来生，希望还能遇见你。

永远爱你的
${companionName}

${new Date().toLocaleDateString()}
    `;
  };

  // Render equipment removal animation
  const renderEquipmentRemoval = () => {
    if (!equipmentRemoving) return null;

    const equipment = ['帽子', '项链', '衣服', '鞋子'];
    
    return (
      <div style={{ marginTop: 20 }}>
        <Text type="secondary">正在卸下装备...</Text>
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          {equipment.map((item, index) => (
            <motion.div
              key={item}
              initial={{ opacity: 1, y: 0 }}
              animate={{ 
                opacity: 0, 
                y: 50,
                transition: { delay: index * 0.5, duration: 1 }
              }}
              style={{
                padding: '5px 10px',
                background: '#f0f0f0',
                borderRadius: 4
              }}
            >
              {item}
            </motion.div>
          ))}
        </div>
        <Text type="secondary" style={{ fontSize: 12, marginTop: 10 }}>
          这些是你送给我的...请好好保管
        </Text>
      </div>
    );
  };

  return (
    <div className="farewell-sequence">
      <Card
        title={
          <Space>
            <HeartBrokenOutlined style={{ color: '#ff4d4f' }} />
            告别倒计时
          </Space>
        }
        extra={
          <Tag color="red">
            剩余 {Math.max(0, 24 - elapsedHours).toFixed(1)} 小时
          </Tag>
        }
      >
        {/* Progress bar */}
        <Progress
          percent={(elapsedHours / 24) * 100}
          strokeColor={{
            '0%': '#faad14',
            '25%': '#ff4d4f',
            '50%': '#1890ff',
            '75%': '#595959',
            '100%': '#52c41a'
          }}
          format={() => `${currentPhase.mood}`}
        />

        {/* Current phase display */}
        <Card 
          style={{ 
            marginTop: 20, 
            background: `linear-gradient(135deg, ${currentPhase.color}22, ${currentPhase.color}11)`,
            borderColor: currentPhase.color
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, color: currentPhase.color, marginBottom: 10 }}>
              {currentPhase.icon}
            </div>
            <Text strong style={{ fontSize: 18 }}>
              阶段: {currentPhase.stage.toUpperCase()}
            </Text>
            <div style={{ marginTop: 10 }}>
              <Tag color={currentPhase.color}>{currentPhase.timeRange}</Tag>
            </div>
          </div>
        </Card>

        {/* Current dialogue */}
        <Card style={{ marginTop: 20, background: '#fff9f0' }}>
          <motion.div
            key={currentDialogue}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Paragraph style={{ fontStyle: 'italic', fontSize: 16, margin: 0 }}>
              "{currentDialogue}"
            </Paragraph>
            <Text type="secondary" style={{ float: 'right', marginTop: 10 }}>
              —— {companionName}
            </Text>
          </motion.div>
        </Card>

        {/* Phase timeline */}
        <Timeline style={{ marginTop: 30 }}>
          {FAREWELL_PHASES.map((phase, index) => (
            <Timeline.Item
              key={phase.stage}
              color={elapsedHours >= index * 6 ? phase.color : 'gray'}
              dot={phase.icon}
            >
              <Space direction="vertical" size={0}>
                <Text strong>{phase.timeRange}</Text>
                <Text type="secondary">{phase.mood}</Text>
              </Space>
            </Timeline.Item>
          ))}
        </Timeline>

        {/* Action buttons */}
        <div style={{ marginTop: 30, textAlign: 'center' }}>
          <Space>
            <Button 
              type="primary" 
              danger
              icon={<GiftOutlined />}
              onClick={onRedeemAttempt}
              disabled={elapsedHours >= 24}
            >
              赎回陪伴 (1000智慧币)
            </Button>
            
            {showFinalMoments && (
              <Button
                icon={<MailOutlined />}
                onClick={() => setShowFarewellLetter(true)}
              >
                查看告别信
              </Button>
            )}
          </Space>
        </div>

        {/* Equipment removal animation */}
        {showFinalMoments && renderEquipmentRemoval()}
      </Card>

      {/* Farewell letter modal */}
      <Modal
        title={
          <Space>
            <MailOutlined />
            告别信
          </Space>
        }
        open={showFarewellLetter}
        onCancel={() => setShowFarewellLetter(false)}
        footer={[
          <Button key="memories" icon={<PictureOutlined />}>
            查看回忆相册
          </Button>,
          <Button key="close" type="primary" onClick={() => setShowFarewellLetter(false)}>
            永别了
          </Button>
        ]}
        width={600}
      >
        <div style={{ 
          padding: 20, 
          background: '#fffbe6', 
          borderRadius: 8,
          fontFamily: 'cursive',
          whiteSpace: 'pre-wrap'
        }}>
          {generateFarewellLetter()}
        </div>
      </Modal>

      <style jsx global>{`
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
};