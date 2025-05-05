
import React from 'react';

interface EmptyTemplateStateProps {
  isArchiveView: boolean;
}

const EmptyTemplateState: React.FC<EmptyTemplateStateProps> = ({ isArchiveView }) => {
  return (
    <div className="py-8 text-center text-gray-500">
      <p>No {isArchiveView ? 'archived ' : ''}payment plan templates found.</p>
    </div>
  );
};

export default EmptyTemplateState;
