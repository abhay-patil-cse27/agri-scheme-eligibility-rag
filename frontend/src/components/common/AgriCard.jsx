import React from 'react';
import { motion } from 'framer-motion';

const AgriCard = ({ 
  children, 
  className = '', 
  style = {}, 
  animate = true,
  hover = true,
  padding = '24px',
  borderRadius = '24px'
}) => {
  const content = (
    <div 
      className={`agri-card ${className}`}
      style={{
        padding,
        borderRadius,
        ...style
      }}
    >
      {children}
    </div>
  );

  if (!animate) return content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { y: -4 } : {}}
      transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
      style={{ height: '100%' }}
    >
      {content}
    </motion.div>
  );
};

export default AgriCard;
