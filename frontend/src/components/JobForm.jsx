import React, { useState } from "react";
import Input from "./ui/Input";
import Textarea from "./ui/Textarea";
import Button from "./ui/button";
import Card from "./ui/Card";

const JobForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    salary: "",
    description: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
    console.log("Job posted:", formData);
    setFormData({
      title: "",
      company: "",
      location: "",
      salary: "",
      description: "",
    });
  };

  return (
    <Card className="max-w-lg mx-auto mt-10">
      <h2 className="text-2xl font-bold text-blue-700 mb-4">Post a Job</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Job Title"
          required
        />
        <Input
          type="text"
          name="company"
          value={formData.company}
          onChange={handleChange}
          placeholder="Company"
          required
        />
        <Input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="Location"
          required
        />
        <Input
          type="number"
          name="salary"
          value={formData.salary}
          onChange={handleChange}
          placeholder="Salary"
        />
        <Textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Job Description"
          rows={6}
          required
        />
        <Button type="submit" className="w-full">
          Post Job
        </Button>
      </form>
    </Card>
  );
};

export default JobForm;
