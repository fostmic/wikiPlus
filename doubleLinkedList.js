//Bare bones doubly linked list implementation for WikiPlus
//Author: Michael Foster

function Node(data) {
  this.data = data;
  this.next = null;
  this.previous = null;
}

function DoubleLinkedList() {
  this.head = null;
  this.curNode = null;
}

DoubleLinkedList.prototype.insertAfterCurrent = function(data) {
  var newNode = new Node(data);
  if (this.curNode)
  {
    newNode.next = this.curNode.next;
    newNode.previous = this.curNode;
    if (newNode.next)
    {
      newNode.next.previous = newNode;
    }
    this.curNode.next = newNode;
  }
  else
  {
    this.head = newNode;
    this.curNode = newNode;
  }
}

DoubleLinkedList.prototype.insertBeforeCurrent = function(data) {
  var newNode = new Node(data);
  if (this.curNode)
  {
    newNode.previous = this.curNode.previous;
    newNode.next = this.curNode;
    if (newNode.previous)
    {
        newNode.previous.next = newNode;
    }
    this.curNode.previous = newNode;

    if (this.curNode === this.head)
    {
      this.head = newNode;
    }
  }
  else
  {
    this.head = newNode;
    this.curNode = newNode;
  }
}

DoubleLinkedList.prototype.gotoNext = function() {
  if (this.curNode.next)
  {
    this.curNode = this.curNode.next;
    return true;
  }
  else {
    return false;
  }
}
