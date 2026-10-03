export interface Answer {
  text: string
  correct: boolean
}

export interface Quiz {
  question: string
  answers: Answer[]
}

export interface Issue {
  name: string
  favored: Quiz
  opposed: Quiz
}

export const ISSUES: Issue[] = [
  {
    "name": "Health Care",
    "favored": {
      "question": "What measures will you take to improve access to healthcare for all citizens?",
      "answers": [
        {
          "text": "Implement universal healthcare.",
          "correct": false
        },
        {
          "text": "Privatize healthcare services.",
          "correct": false
        },
        {
          "text": "Increase funding for public healthcare programs.",
          "correct": true
        }
      ]
    },
    "opposed": {
      "question": "How would you reduce government spending on healthcare?",
      "answers": [
        {
          "text": "Decrease funding for public healthcare programs.",
          "correct": false
        },
        {
          "text": "Privatize healthcare services.",
          "correct": false
        },
        {
          "text": "Implement universal healthcare.",
          "correct": true
        }
      ]
    }
  },
  {
    "name": "Education",
    "favored": {
      "question": "How will you improve the quality of public education in our state?",
      "answers": [
        {
          "text": "Increase funding for public schools.",
          "correct": true
        },
        {
          "text": "Implement standardized testing for teachers.",
          "correct": false
        },
        {
          "text": "Provide vouchers for private schools.",
          "correct": false
        }
      ]
    },
    "opposed": {
      "question": "What measures will you take to reduce government involvement in education?",
      "answers": [
        {
          "text": "Privatize education.",
          "correct": false
        },
        {
          "text": "Implement standardized testing for teachers.",
          "correct": false
        },
        {
          "text": "Increase funding for public schools.",
          "correct": true
        }
      ]
    }
  },
  {
    "name": "Climate Change",
    "favored": {
      "question": "What actions will you take to combat climate change?",
      "answers": [
        {
          "text": "Invest in renewable energy sources.",
          "correct": true
        },
        {
          "text": "Deregulate the fossil fuel industry.",
          "correct": false
        },
        {
          "text": "Subsidize coal production.",
          "correct": false
        }
      ]
    },
    "opposed": {
      "question": "How would you address the economic benefits of fossil fuel production?",
      "answers": [
        {
          "text": "Deregulate the fossil fuel industry.",
          "correct": false
        },
        {
          "text": "Invest in renewable energy sources.",
          "correct": false
        },
        {
          "text": "Subsidize coal production.",
          "correct": true
        }
      ]
    }
  },
  {
    "name": "Minimum Wage",
    "favored": {
      "question": "How will you address the issue of increasing the minimum wage?",
      "answers": [
        {
          "text": "Implement a $100 minimum wage.",
          "correct": true
        },
        {
          "text": "Abolish the minimum wage.",
          "correct": false
        },
        {
          "text": "Allow individual states to set their minimum wage.",
          "correct": false
        }
      ]
    },
    "opposed": {
      "question": "What measures will you take to prevent an increase in the minimum wage?",
      "answers": [
        {
          "text": "Abolish the minimum wage.",
          "correct": false
        },
        {
          "text": "Allow individual states to set their minimum wage.",
          "correct": true
        },
        {
          "text": "Implement a $100 minimum wage.",
          "correct": false
        }
      ]
    }
  },
  {
    "name": "Gun Control",
    "favored": {
      "question": "What measures will you take to implement responsible gun control laws?",
      "answers": [
        {
          "text": "Enforce universal background checks.",
          "correct": true
        },
        {
          "text": "Arm teachers in schools.",
          "correct": false
        },
        {
          "text": "Repeal all gun control laws.",
          "correct": false
        }
      ]
    },
    "opposed": {
      "question": "How would you ensure the protection of Second Amendment rights?",
      "answers": [
        {
          "text": "Arm teachers in schools.",
          "correct": false
        },
        {
          "text": "Repeal all gun control laws.",
          "correct": true
        },
        {
          "text": "Enforce universal background checks.",
          "correct": false
        }
      ]
    }
  },
  {
    "name": "Infrastructure",
    "favored": {
      "question": "What steps will you take to improve the state's infrastructure?",
      "answers": [
        {
          "text": "Increase funding for repairing roads and bridges.",
          "correct": true
        },
        {
          "text": "Privatize infrastructure maintenance.",
          "correct": false
        },
        {
          "text": "Decrease funding for public transportation.",
          "correct": false
        }
      ]
    },
    "opposed": {
      "question": "How would you reduce government spending on infrastructure?",
      "answers": [
        {
          "text": "Privatize infrastructure maintenance.",
          "correct": false
        },
        {
          "text": "Decrease funding for public transportation.",
          "correct": true
        },
        {
          "text": "Increase funding for repairing roads and bridges.",
          "correct": false
        }
      ]
    }
  },
  {
    "name": "Immigration",
    "favored": {
      "question": "How will you reform the immigration system to ensure fairness and security?",
      "answers": [
        {
          "text": "Implement a pathway to citizenship for undocumented immigrants.",
          "correct": true
        },
        {
          "text": "Build a wall along the entire border.",
          "correct": false
        },
        {
          "text": "Increase deportations of undocumented immigrants.",
          "correct": false
        }
      ]
    },
    "opposed": {
      "question": "What measures will you take to decrease immigration to the country?",
      "answers": [
        {
          "text": "Build a wall along the entire border.",
          "correct": true
        },
        {
          "text": "Increase deportations of undocumented immigrants.",
          "correct": false
        },
        {
          "text": "Implement a pathway to citizenship for undocumented immigrants.",
          "correct": false
        }
      ]
    }
  },
  {
    "name": "Taxation",
    "favored": {
      "question": "What changes will you make to the tax system to ensure fairness and adequacy?",
      "answers": [
        {
          "text": "Implement a progressive tax system.",
          "correct": true
        },
        {
          "text": "Cut taxes for the wealthy.",
          "correct": false
        },
        {
          "text": "Increase taxes on the middle class.",
          "correct": false
        }
      ]
    },
    "opposed": {
      "question": "How would you reduce taxes for the wealthy?",
      "answers": [
        {
          "text": "Cut taxes for the wealthy.",
          "correct": false
        },
        {
          "text": "Increase taxes on the middle class.",
          "correct": true
        },
        {
          "text": "Implement a progressive tax system.",
          "correct": false
        }
      ]
    }
  },
  {
    "name": "Gender Equality",
    "favored": {
      "question": "How will you promote gender equality and address gender discrimination?",
      "answers": [
        {
          "text": "Enforce equal pay for equal work.",
          "correct": true
        },
        {
          "text": "Limit women's access to certain jobs.",
          "correct": false
        },
        {
          "text": "Abolish women's rights movements.",
          "correct": false
        }
      ]
    },
    "opposed": {
      "question": "What measures will you take to roll back gender equality initiatives?",
      "answers": [
        {
          "text": "Limit women's access to certain jobs.",
          "correct": true
        },
        {
          "text": "Abolish women's rights movements.",
          "correct": false
        },
        {
          "text": "Enforce equal pay for equal work.",
          "correct": false
        }
      ]
    }
  },
  {
    "name": "Affordable Housing",
    "favored": {
      "question": "What measures will you take to ensure affordable housing for all citizens?",
      "answers": [
        {
          "text": "Increase funding for low-income housing programs.",
          "correct": true
        },
        {
          "text": "Deregulate the housing market.",
          "correct": false
        },
        {
          "text": "Privatize public housing.",
          "correct": false
        }
      ]
    },
    "opposed": {
      "question": "How would you address the shortage of affordable housing without government intervention?",
      "answers": [
        {
          "text": "Deregulate the housing market.",
          "correct": false
        },
        {
          "text": "Privatize public housing.",
          "correct": true
        },
        {
          "text": "Increase funding for low-income housing programs.",
          "correct": false
        }
      ]
    }
  },
  {
    "name": "Racial Justice",
    "favored": {
      "question": "What steps will you take to address racial injustice and promote equality?",
      "answers": [
        {
          "text": "Implement police reform and accountability measures.",
          "correct": true
        },
        {
          "text": "Increase funding for racially discriminatory institutions.",
          "correct": false
        },
        {
          "text": "Abolish affirmative action programs.",
          "correct": false
        }
      ]
    },
    "opposed": {
      "question": "How would you prevent the implementation of affirmative action programs?",
      "answers": [
        {
          "text": "Increase funding for racially discriminatory institutions.",
          "correct": true
        },
        {
          "text": "Abolish affirmative action programs.",
          "correct": false
        },
        {
          "text": "Implement police reform and accountability measures.",
          "correct": false
        }
      ]
    }
  },
  {
    "name": "National Security",
    "favored": {
      "question": "How will you ensure national security while protecting civil liberties?",
      "answers": [
        {
          "text": "Strengthen intelligence and diplomatic efforts.",
          "correct": true
        },
        {
          "text": "Increase domestic surveillance.",
          "correct": false
        },
        {
          "text": "Implement martial law.",
          "correct": false
        }
      ]
    },
    "opposed": {
      "question": "What measures will you take to increase domestic surveillance?",
      "answers": [
        {
          "text": "Increase domestic surveillance.",
          "correct": true
        },
        {
          "text": "Implement martial law.",
          "correct": false
        },
        {
          "text": "Strengthen intelligence and diplomatic efforts.",
          "correct": false
        }
      ]
    }
  },
  {
    "name": "Environmental Protection",
    "favored": {
      "question": "What steps will you take to protect the environment and prevent pollution?",
      "answers": [
        {
          "text": "Enforce strict environmental regulations.",
          "correct": true
        },
        {
          "text": "Roll back environmental protections.",
          "correct": false
        },
        {
          "text": "Encourage industrial pollution.",
          "correct": false
        }
      ]
    },
    "opposed": {
      "question": "How would you reduce government regulations on environmental protection?",
      "answers": [
        {
          "text": "Roll back environmental protections.",
          "correct": true
        },
        {
          "text": "Encourage industrial pollution.",
          "correct": false
        },
        {
          "text": "Enforce strict environmental regulations.",
          "correct": false
        }
      ]
    }
  },
  {
    "name": "Elderly Care",
    "favored": {
      "question": "How will you improve care for the elderly and support caregivers?",
      "answers": [
        {
          "text": "Increase funding for Medicare and Medicaid.",
          "correct": true
        },
        {
          "text": "Privatize Medicare and Medicaid.",
          "correct": false
        },
        {
          "text": "Cut funding for elderly care programs.",
          "correct": false
        }
      ]
    },
    "opposed": {
      "question": "What measures will you take to cut funding for elderly care programs?",
      "answers": [
        {
          "text": "Privatize Medicare and Medicaid.",
          "correct": true
        },
        {
          "text": "Cut funding for elderly care programs.",
          "correct": false
        },
        {
          "text": "Increase funding for Medicare and Medicaid.",
          "correct": false
        }
      ]
    }
  },
  {
    "name": "Drug Policy",
    "favored": {
      "question": "How will you address the opioid epidemic and drug addiction?",
      "answers": [
        {
          "text": "Increase funding for addiction treatment programs.",
          "correct": true
        },
        {
          "text": "Implement stricter drug sentencing laws.",
          "correct": false
        },
        {
          "text": "Legalize all drugs.",
          "correct": false
        }
      ]
    },
    "opposed": {
      "question": "What measures will you take to maintain strict drug sentencing laws?",
      "answers": [
        {
          "text": "Implement stricter drug sentencing laws.",
          "correct": true
        },
        {
          "text": "Legalize all drugs.",
          "correct": false
        },
        {
          "text": "Increase funding for addiction treatment programs.",
          "correct": false
        }
      ]
    }
  },
  {
    "name": "Cybersecurity",
    "favored": {
      "question": "What steps will you take to enhance cybersecurity and protect against cyber threats?",
      "answers": [
        {
          "text": "Invest in cybersecurity infrastructure and training.",
          "correct": true
        },
        {
          "text": "Deregulate the internet to allow for more competition.",
          "correct": false
        },
        {
          "text": "Decrease funding for cybersecurity programs.",
          "correct": false
        }
      ]
    },
    "opposed": {
      "question": "How would you reduce government spending on cybersecurity?",
      "answers": [
        {
          "text": "Deregulate the internet to allow for more competition.",
          "correct": false
        },
        {
          "text": "Decrease funding for cybersecurity programs.",
          "correct": true
        },
        {
          "text": "Invest in cybersecurity infrastructure and training.",
          "correct": false
        }
      ]
    }
  },
  {
    "name": "Animal Rights",
    "favored": {
      "question": "What measures will you take to protect animal rights and prevent animal cruelty?",
      "answers": [
        {
          "text": "Strengthen animal welfare laws and enforcement.",
          "correct": true
        },
        {
          "text": "Deregulate animal welfare laws.",
          "correct": false
        },
        {
          "text": "Promote animal testing for cosmetic products.",
          "correct": false
        }
      ]
    },
    "opposed": {
      "question": "How would you deregulate animal welfare laws?",
      "answers": [
        {
          "text": "Deregulate animal welfare laws.",
          "correct": true
        },
        {
          "text": "Promote animal testing for cosmetic products.",
          "correct": false
        },
        {
          "text": "Strengthen animal welfare laws and enforcement.",
          "correct": false
        }
      ]
    }
  },
  {
    "name": "LGBTQ+ Rights",
    "favored": {
      "question": "How will you promote LGBTQ+ rights and protect against discrimination?",
      "answers": [
        {
          "text": "Enforce anti-discrimination laws.",
          "correct": true
        },
        {
          "text": "Roll back LGBTQ+ rights protections.",
          "correct": false
        },
        {
          "text": "Promote conversion therapy.",
          "correct": false
        }
      ]
    },
    "opposed": {
      "question": "What measures will you take to roll back LGBTQ+ rights protections?",
      "answers": [
        {
          "text": "Roll back LGBTQ+ rights protections.",
          "correct": true
        },
        {
          "text": "Promote conversion therapy.",
          "correct": false
        },
        {
          "text": "Enforce anti-discrimination laws.",
          "correct": false
        }
      ]
    }
  },
  {
    "name": "Privacy",
    "favored": {
      "question": "What steps will you take to protect citizens' privacy rights?",
      "answers": [
        {
          "text": "Strengthen data protection regulations.",
          "correct": true
        },
        {
          "text": "Increase government surveillance.",
          "correct": false
        },
        {
          "text": "Allow companies to sell personal data without consent.",
          "correct": false
        }
      ]
    },
    "opposed": {
      "question": "How would you increase government surveillance?",
      "answers": [
        {
          "text": "Increase government surveillance.",
          "correct": true
        },
        {
          "text": "Allow companies to sell personal data without consent.",
          "correct": false
        },
        {
          "text": "Strengthen data protection regulations.",
          "correct": false
        }
      ]
    }
  },
  {
    "name": "Foreign Policy",
    "favored": {
      "question": "What measures will you take to promote peace and cooperation in foreign relations?",
      "answers": [
        {
          "text": "Prioritize diplomacy and international cooperation.",
          "correct": true
        },
        {
          "text": "Increase military spending and intervention.",
          "correct": false
        },
        {
          "text": "Implement protectionist trade policies.",
          "correct": false
        }
      ]
    },
    "opposed": {
      "question": "How would you increase military spending and intervention?",
      "answers": [
        {
          "text": "Increase military spending and intervention.",
          "correct": true
        },
        {
          "text": "Implement protectionist trade policies.",
          "correct": false
        },
        {
          "text": "Prioritize diplomacy and international cooperation.",
          "correct": false
        }
      ]
    }
  }
]
